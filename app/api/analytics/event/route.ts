import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { hasServiceRoleKey } from "@/lib/runtime";

const bodySchema = z.object({
  projectId: z.string().uuid(),
  eventName: z.string().min(1).max(120),
  pagePath: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`analytics:${ip}`, 200, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!hasServiceRoleKey()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const admin = createServiceRoleClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, status")
    .eq("id", parsed.data.projectId)
    .maybeSingle();

  if (!project || project.status !== "published") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await admin.from("analytics_events").insert({
    project_id: project.id,
    event_name: parsed.data.eventName,
    page_path: parsed.data.pagePath ?? null,
    metadata: parsed.data.metadata ?? null,
  });

  return NextResponse.json({ ok: true });
}
