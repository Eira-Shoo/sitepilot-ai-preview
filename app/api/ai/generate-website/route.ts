import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validators/onboarding";
import { rateLimit } from "@/lib/rate-limit";
import { isDemoDeploy, isPublicDemoMode } from "@/lib/runtime";
import {
  getGenerationConfigState,
  getPublicGenerationStatus,
  logGenerationConfigOnce,
} from "@/lib/ai/generation-config";
import { OPENAI_KEY_MISSING_MESSAGE } from "@/lib/ai/generation-messages";
import {
  generationFailureBody,
  generationSuccessBody,
} from "@/lib/ai/generation-api-response";
import { DEMO_PROJECT_ID } from "@/lib/demo-project";
import {
  createBlueprintFromOnboarding,
  OPENAI_GENERATION_FAILED_MESSAGE,
  OpenAiGenerationError,
  toSafeErrorInfo,
} from "@/lib/openai/generate-website-blueprint";
import { applyDevOpenAiKeyFromEnvLocal } from "@/lib/openai/resolve-api-key";

const bodySchema = z.object({
  onboarding: onboardingSchema,
  projectId: z.string().uuid().optional(),
});

function logGenerationContext(label: string, extra?: Record<string, unknown>) {
  const status = getPublicGenerationStatus();
  console.log(`[SitePilot] ${label}`, {
    demoMode: status.demoMode,
    openaiKeyDetected: status.openaiKeyDetected,
    keySuffix: status.keySuffix,
    expectedSource: status.expectedSource,
    configState: status.configState,
    ...extra,
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`ai-gen:${ip}`, 8, 60 * 60 * 1000);
  if (!rl.ok) {
    const { body, status } = generationFailureBody(
      "rate_limited",
      "Too many generation requests. Please wait and try again.",
      { status: 429 },
    );
    return NextResponse.json(body, { status });
  }

  applyDevOpenAiKeyFromEnvLocal();
  logGenerationConfigOnce();

  let json: unknown;
  try {
    json = await request.json();
  } catch (e) {
    logGenerationContext("Invalid JSON body", {
      error: e instanceof Error ? e.message : String(e),
    });
    const { body, status } = generationFailureBody(
      "invalid_json",
      "Invalid request body.",
      { status: 400 },
    );
    return NextResponse.json(body, { status });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    logGenerationContext("Onboarding validation failed", { zodIssues: issues });
    const { body, status } = generationFailureBody(
      "invalid_payload",
      "Invalid questionnaire data. Check required fields and try again.",
      { details: issues, status: 400 },
    );
    return NextResponse.json(body, { status });
  }

  const { onboarding, projectId } = parsed.data;
  const previewDeploy = isDemoDeploy();
  const allowMockFallback = isPublicDemoMode();

  logGenerationContext("Generate request", {
    businessName: onboarding.basics.businessName,
    allowMockFallback,
    previewDeploy,
  });

  if (getGenerationConfigState() === "unconfigured") {
    const { body, status } = generationFailureBody(
      "openai_key_missing",
      OPENAI_KEY_MISSING_MESSAGE,
      { status: 503 },
    );
    return NextResponse.json(body, { status });
  }

  try {
    const { blueprint, source } = await createBlueprintFromOnboarding(onboarding, {
      allowMockFallback,
    });

    logGenerationContext("Generate success", { source });

    if (previewDeploy) {
      return NextResponse.json(
        generationSuccessBody({
          blueprint,
          projectId: DEMO_PROJECT_ID,
          source,
        }),
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      const { body, status } = generationFailureBody(
        "server_misconfigured",
        "Server is not configured for saving projects.",
        { status: 500 },
      );
      return NextResponse.json(body, { status });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const { body, status } = generationFailureBody(
        "unauthorized",
        "Please log in to save your website draft.",
        { status: 401 },
      );
      return NextResponse.json(body, { status });
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
      return NextResponse.json(
        generationSuccessBody({ blueprint, projectId, source }),
      );
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

    return NextResponse.json(
      generationSuccessBody({ blueprint, projectId: project.id, source }),
    );
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : String(e);
    const errStack = e instanceof Error ? e.stack : undefined;

    if (OpenAiGenerationError.isInstance(e)) {
      const safe = toSafeErrorInfo(e);
      console.error("[generate-website] OpenAI generation failed", safe);
      logGenerationContext("OpenAI generation failed", {
        code: safe.code,
        message: safe.message,
      });
      const { body, status } = generationFailureBody(
        e.code,
        OPENAI_GENERATION_FAILED_MESSAGE,
        {
          details: e.details ?? safe.message,
          status: e.statusCode,
        },
      );
      return NextResponse.json(body, { status });
    }

    if (e instanceof z.ZodError) {
      const issues = e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      logGenerationContext("Blueprint Zod validation failed", { zodIssues: issues });
      const { body, status } = generationFailureBody(
        "blueprint_validation_failed",
        "Could not generate website draft — the AI response did not match the required structure.",
        { details: issues, status: 502 },
      );
      return NextResponse.json(body, { status });
    }

    console.error("[SitePilot] Generation failed:", errMessage, errStack);
    const { body, status } = generationFailureBody(
      "generation_failed",
      "Could not generate website draft. Please try again.",
      { details: errMessage, status: 500 },
    );
    return NextResponse.json(body, { status });
  }
}
