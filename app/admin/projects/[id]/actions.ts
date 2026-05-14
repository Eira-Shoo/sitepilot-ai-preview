"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { uniquePublishedSlug } from "@/lib/slug";

async function assertAdmin() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") throw new Error("Forbidden");
  return supabase;
}

export async function approveProject(formData: FormData) {
  const projectId = z.string().uuid().parse(formData.get("projectId"));
  const supabase = await assertAdmin();
  await supabase
    .from("projects")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", projectId);
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function publishProject(formData: FormData) {
  const projectId = z.string().uuid().parse(formData.get("projectId"));
  const supabase = await assertAdmin();
  const { data: project } = await supabase
    .from("projects")
    .select("business_name, published_slug")
    .eq("id", projectId)
    .maybeSingle();
  const slug =
    project?.published_slug && project.published_slug.length > 0
      ? project.published_slug
      : uniquePublishedSlug(project?.business_name ?? "site");

  await supabase
    .from("projects")
    .update({
      status: "published",
      published_slug: slug,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/site/${slug}`);
}

export async function markProjectPaid(formData: FormData) {
  const projectId = z.string().uuid().parse(formData.get("projectId"));
  const supabase = await assertAdmin();
  await supabase
    .from("projects")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", projectId);
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${projectId}`);
}
