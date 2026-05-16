import { NextResponse } from "next/server";
import { getPublicGenerationStatus, logGenerationConfigOnce } from "@/lib/ai/generation-config";

export async function GET() {
  logGenerationConfigOnce();
  return NextResponse.json(getPublicGenerationStatus());
}
