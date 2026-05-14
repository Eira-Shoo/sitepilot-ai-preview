import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { recommendImprovements } from "@/lib/openai/blueprint";
import { websiteBlueprintSchema } from "@/lib/validators/website-blueprint";
import { isDemoDeploy } from "@/lib/runtime";

const bodySchema = z.object({
  projectId: z.string().uuid(),
  blueprint: z.unknown().optional(),
  metricsSummary: z.string().max(12000).optional(),
});

const canned = [
  {
    recommendation_type: "conversion",
    title: "Tighten the hero CTA",
    description:
      "Preview mode: connect analytics to prioritize CTAs that drive form submissions.",
    priority: "high",
  },
  {
    recommendation_type: "seo",
    title: "Expand local SEO block",
    description: "Add neighborhood + service modifiers derived from your Google listing data.",
    priority: "medium",
  },
  {
    recommendation_type: "trust",
    title: "Surface proof earlier",
    description: "Move certifications or process steps above the fold on mobile.",
    priority: "medium",
  },
];

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (isDemoDeploy()) {
    return NextResponse.json({ recommendations: canned });
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id, blueprint")
    .eq("id", parsed.data.projectId)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = profile?.role === "admin";
  const isOwner = project.user_id === user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const blueprintParsed = websiteBlueprintSchema.safeParse(
    parsed.data.blueprint ?? project.blueprint,
  );
  if (!blueprintParsed.success) {
    return NextResponse.json({ error: "Invalid blueprint" }, { status: 400 });
  }

  let metricsSummary =
    parsed.data.metricsSummary ??
    "No detailed analytics provided for this run.";

  if (isAdmin || isOwner) {
    try {
      const admin = createServiceRoleClient();
      const { data: events } = await admin
        .from("analytics_events")
        .select("event_name, page_path, created_at")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (events?.length) {
        const counts: Record<string, number> = {};
        for (const e of events) {
          counts[e.event_name] = (counts[e.event_name] ?? 0) + 1;
        }
        metricsSummary = `Recent events (last ${events.length}): ${JSON.stringify(counts)}`;
      }
    } catch {
      /* service role not configured */
    }
  }

  try {
    const recs = await recommendImprovements(blueprintParsed.data, metricsSummary);
    try {
      const admin = createServiceRoleClient();
      for (const r of recs) {
        await admin.from("ai_recommendations").insert({
          project_id: project.id,
          recommendation_type: r.recommendation_type,
          title: r.title,
          description: r.description,
          priority: r.priority,
          status: "pending",
        });
      }
    } catch {
      /* skip DB persistence */
    }
    return NextResponse.json({ recommendations: recs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
