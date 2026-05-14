import { NextResponse } from "next/server";
import { z } from "zod";
import { placeDetails } from "@/lib/google/places";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({ placeId: z.string().min(4).max(256) });

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`places-details:${ip}`, 60, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid place id" }, { status: 400 });
  }
  const details = await placeDetails(parsed.data.placeId);
  if (!details) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ result: details });
}
