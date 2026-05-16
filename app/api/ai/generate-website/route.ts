import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validators/onboarding";
import { rateLimit } from "@/lib/rate-limit";
import { isDemoDeploy, isPublicDemoMode } from "@/lib/runtime";
import {
  getGenerationConfigState,
  logGenerationConfigOnce,
  OPENAI_KEY_MISSING_MESSAGE,
} from "@/lib/ai/generation-config";
import { DEMO_PROJECT_ID } from "@/lib/demo-project";
import {
  createBlueprintFromOnboarding,
  OpenAiGenerationError,
} from "@/lib/openai/generate-website-blueprint";
import { applyDevOpenAiKeyFromEnvLocal } from "@/lib/openai/resolve-api-key";

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

  const { onboarding, projectId } = parsed.data;
  const previewDeploy = isDemoDeploy();
  const allowMockFallback = isPublicDemoMode();

  applyDevOpenAiKeyFromEnvLocal();
  logGenerationConfigOnce();

  if (getGenerationConfigState() === "unconfigured") {
    return NextResponse.json(
      { error: OPENAI_KEY_MISSING_MESSAGE, code: "openai_key_missing" },
      { status: 503 },
    );
  }

  try {
    const { blueprint, source } = await createBlueprintFromOnboarding(onboarding, {
      allowMockFallback,
    });

    if (previewDeploy) {
      return NextResponse.json({
        blueprint,
        projectId: DEMO_PROJECT_ID,
        source,
      });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        google_place_data: onboarding.localBusiness.placeDetails ?? null,
      });
      return NextResponse.json({ blueprint, projectId, source });
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
      google_place_data: onboarding.localBusiness.placeDetails ?? null,
    });

    return NextResponse.json({ blueprint, projectId: project.id, source });
  } catch (e) {
    console.error(e);
    if (e instanceof OpenAiGenerationError) {
      return NextResponse.json(
        {
          error: e.message,
          code: e.code,
        },
        { status: e.statusCode },
      );
    }
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
