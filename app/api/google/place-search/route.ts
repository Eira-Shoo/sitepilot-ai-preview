import { NextResponse } from "next/server";
import { z } from "zod";
import { searchPlaces } from "@/lib/google/places";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({ query: z.string().min(2).max(200) });

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`places-search:${ip}`, 40, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { results } = await searchPlaces(parsed.data.query);
  return NextResponse.json({ results });
}
