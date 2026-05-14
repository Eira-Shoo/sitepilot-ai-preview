import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/sanitize";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { rateLimit } from "@/lib/rate-limit";
import { hasServiceRoleKey, isDemoDeploy } from "@/lib/runtime";

const bodySchema = z.object({
  projectId: z.string().uuid(),
  publishedSlug: z.string().max(120).optional(),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal("")),
  message: z.string().min(1).max(4000),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`contact:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (isDemoDeploy()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  if (!hasServiceRoleKey()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const admin = createServiceRoleClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, status, published_slug, user_id")
    .eq("id", parsed.data.projectId)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const isOwner = user?.id === project.user_id;
  const slugMatches =
    Boolean(parsed.data.publishedSlug) &&
    project.published_slug === parsed.data.publishedSlug;
  const isPublicPublished = project.status === "published" && slugMatches;

  if (!isOwner && !isPublicPublished) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: owner } = await admin
    .from("profiles")
    .select("email")
    .eq("id", project.user_id)
    .maybeSingle();

  await admin.from("contact_submissions").insert({
    project_id: project.id,
    name: sanitizeText(parsed.data.name, 200),
    email: sanitizeText(parsed.data.email, 200),
    phone: sanitizeText(parsed.data.phone ?? "", 40),
    message: sanitizeText(parsed.data.message, 4000),
  });

  if (owner?.email) {
    await sendTransactionalEmail({
      to: owner.email,
      subject: `New contact: ${sanitizeText(parsed.data.name, 120)}`,
      html: `<p><strong>Name:</strong> ${sanitizeText(parsed.data.name, 200)}</p>
      <p><strong>Email:</strong> ${sanitizeText(parsed.data.email, 200)}</p>
      <p><strong>Message:</strong><br/>${sanitizeText(parsed.data.message, 4000).replace(/\n/g, "<br/>")}</p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
