import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { isMockGenerationForced } from "@/lib/ai/generation-config";
import { mergeOnboardingImport } from "@/lib/onboarding/merge-onboarding-import";
import { parseBusinessBriefText } from "@/lib/onboarding/parse-business-brief";
import { resolveOpenAiApiKey } from "@/lib/openai/resolve-api-key";
import { applyDevOpenAiKeyFromEnvLocal } from "@/lib/openai/resolve-api-key";

const bodySchema = z.object({
  text: z.string().min(10).max(50_000),
});

const SYSTEM = `You extract a website onboarding questionnaire from a business brief.
Return a single JSON object with these optional keys matching this shape:
{
  "basics": { "businessName", "industry", "businessType", "country", "city", "language", "description" },
  "mainGoal": { "primary", "primaryCta", "secondaryCta", "preferredContact" },
  "targetAudience": { "who", "problems", "careAbout", "feelTags": string[] },
  "offers": { "services": [{ "name", "description", "startingPrice", "duration", "included", "cta" }] },
  "branding": { "preferredWebsiteStyle": string[], "websiteMood": string[], "colorsPreferred", "fontStyle" },
  "trust": { "yearsExperience", "guarantees", "certifications" },
  "seo": { "mainKeyword", "secondaryKeywords", "regionKeywords" },
  "extraFeatures": string[]
}
Use only strings and arrays of strings. Do not include circular references or commentary.`;

export async function POST(request: Request) {
  applyDevOpenAiKeyFromEnvLocal();

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { text } = body.data;
  const local = parseBusinessBriefText(text);

  if (isMockGenerationForced()) {
    const merged = mergeOnboardingImport(local.partial);
    if (!merged.success) {
      return NextResponse.json({ ok: false, error: merged.error }, { status: 422 });
    }
    return NextResponse.json({
      ok: true,
      source: "local",
      preview: local.preview,
      onboarding: merged.data,
    });
  }

  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) {
    const merged = mergeOnboardingImport(local.partial);
    if (!merged.success) {
      return NextResponse.json({ ok: false, error: merged.error }, { status: 422 });
    }
    return NextResponse.json({
      ok: true,
      source: "local",
      preview: local.preview,
      onboarding: merged.data,
    });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Business brief:\n\n${text.slice(0, 12_000)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ ok: false, error: "empty_response" }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 502 });
    }

    const merged = mergeOnboardingImport(parsed);
    if (!merged.success) {
      const fallback = mergeOnboardingImport(local.partial);
      if (fallback.success) {
        return NextResponse.json({
          ok: true,
          source: "local_fallback",
          preview: local.preview,
          onboarding: fallback.data,
        });
      }
      return NextResponse.json({ ok: false, error: merged.error }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      source: "openai",
      preview: local.preview,
      onboarding: merged.data,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "parse_failed";
    const fallback = mergeOnboardingImport(local.partial);
    if (fallback.success) {
      return NextResponse.json({
        ok: true,
        source: "local_fallback",
        preview: local.preview,
        onboarding: fallback.data,
        warning: message,
      });
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
