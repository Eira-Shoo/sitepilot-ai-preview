import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { editBlueprintWithInstruction } from "@/lib/openai/blueprint";
import { websiteBlueprintSchema } from "@/lib/validators/website-blueprint";
import { rateLimit } from "@/lib/rate-limit";
import { isOfflinePreview } from "@/lib/runtime";
import { DEMO_PROJECT_ID } from "@/lib/demo-project";

const bodySchema = z.object({
  projectId: z.string().uuid(),
  blueprint: z.unknown(),
  instruction: z.string().min(3).max(2000),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`ai-edit:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const current = websiteBlueprintSchema.safeParse(parsed.data.blueprint);
  if (!current.success) {
    return NextResponse.json({ error: "Invalid blueprint" }, { status: 400 });
  }

  if (isOfflinePreview() && parsed.data.projectId === DEMO_PROJECT_ID) {
    try {
      if (process.env.OPENAI_API_KEY) {
        const updated = await editBlueprintWithInstruction(
          current.data,
          parsed.data.instruction,
        );
        return NextResponse.json({ blueprint: updated });
      }
    } catch (e) {
      console.error(e);
    }
    return NextResponse.json({ blueprint: current.data });
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

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", parsed.data.projectId)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (project.user_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const updated = await editBlueprintWithInstruction(
      current.data,
      parsed.data.instruction,
    );
    await supabase
      .from("projects")
      .update({ blueprint: updated, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.projectId);
    return NextResponse.json({ blueprint: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Edit failed" }, { status: 500 });
  }
}
