import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { editBlueprintFromInstruction } from "@/lib/openai/edit-blueprint";
import { websiteBlueprintSchema } from "@/lib/validators/website-blueprint";
import { onboardingSchema } from "@/lib/validators/onboarding";
import { rateLimit } from "@/lib/rate-limit";
import { isDemoDeploy } from "@/lib/runtime";
import { DEMO_PROJECT_ID } from "@/lib/demo-project";
import { applyDevOpenAiKeyFromEnvLocal } from "@/lib/openai/resolve-api-key";

const bodySchema = z.object({
  projectId: z.string().uuid().optional(),
  blueprint: z.unknown(),
  instruction: z.string().min(3).max(2000),
  onboarding: onboardingSchema.optional(),
});

export async function POST(request: Request) {
  applyDevOpenAiKeyFromEnvLocal();

  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`ai-edit:${ip}`, 30, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Rate limited" }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const current = websiteBlueprintSchema.safeParse(parsed.data.blueprint);
  if (!current.success) {
    return NextResponse.json({ ok: false, error: "Invalid blueprint" }, { status: 400 });
  }

  const onboarding = parsed.data.onboarding ?? null;
  const projectId = parsed.data.projectId ?? DEMO_PROJECT_ID;
  const isLocalDemo = isDemoDeploy() || projectId === DEMO_PROJECT_ID;

  try {
    const result = await editBlueprintFromInstruction(
      current.data,
      parsed.data.instruction,
      { onboarding, allowMockFallback: true },
    );

    if (!isLocalDemo) {
      const supabase = await createClient();
      if (!supabase) {
        return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 500 });
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }

      const { data: project } = await supabase
        .from("projects")
        .select("id, user_id")
        .eq("id", projectId)
        .maybeSingle();

      if (!project) {
        return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (project.user_id !== user.id && profile?.role !== "admin") {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }

      await supabase
        .from("projects")
        .update({ blueprint: result.blueprint, updated_at: new Date().toISOString() })
        .eq("id", projectId);
    }

    return NextResponse.json({
      ok: true,
      blueprint: result.blueprint,
      changeSummary: result.changeSummary,
      source: result.source,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Edit failed";
    console.error("[SitePilot] edit-blueprint:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
