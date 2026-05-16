import { NextResponse } from "next/server";
import { getPublicGenerationStatus, logGenerationConfigOnce } from "@/lib/ai/generation-config";
import { applyDevOpenAiKeyFromEnvLocal } from "@/lib/openai/resolve-api-key";

export async function GET() {
  applyDevOpenAiKeyFromEnvLocal();
  logGenerationConfigOnce();
  return NextResponse.json(getPublicGenerationStatus());
}
