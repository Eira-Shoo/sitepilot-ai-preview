import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateBlueprintFromOnboarding } from "@/lib/openai/blueprint";
import { onboardingSchema } from "@/lib/validators/onboarding";
import { rateLimit } from "@/lib/rate-limit";
import { isOfflinePreview } from "@/lib/runtime";
import { parseWebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { demoBlueprint } from "@/lib/demo-blueprint";
import { DEMO_PROJECT_ID } from "@/lib/demo-project";

const bodySchema = z.object({
  onboarding: onboardingSchema,
  projectId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`ai-gen:${ip}`, 8, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (isOfflinePreview()) {
    const blueprint = parseWebsiteBlueprint(demoBlueprint);
    return NextResponse.json({ blueprint, projectId: DEMO_PROJECT_ID });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { onboarding, projectId } = parsed.data;

  try {
    const blueprint = await generateBlueprintFromOnboarding(onboarding);

    if (projectId) {
      const { error } = await supabase
        .from("projects")
        .update({
          blueprint,
          business_name: onboarding.basics.businessName,
          industry: onboarding.basics.industry,
          language: onboarding.basics.language,
          status: "review",
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .eq("user_id", user.id);
      if (error) throw error;

      await supabase.from("project_inputs").delete().eq("project_id", projectId);
      await supabase.from("project_inputs").insert({
        project_id: projectId,
        form_data: onboarding,
        google_place_data: onboarding.maps.placeDetails ?? null,
      });
      return NextResponse.json({ blueprint, projectId });
    }

    const { data: project, error: pErr } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: onboarding.basics.businessName,
        business_name: onboarding.basics.businessName,
        industry: onboarding.basics.industry,
        language: onboarding.basics.language,
        status: "review",
        blueprint,
      })
      .select("id")
      .single();
    if (pErr || !project) throw pErr ?? new Error("Project insert failed");

    await supabase.from("project_inputs").insert({
      project_id: project.id,
      form_data: onboarding,
      google_place_data: onboarding.maps.placeDetails ?? null,
    });

    return NextResponse.json({ blueprint, projectId: project.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 },
    );
  }
}
