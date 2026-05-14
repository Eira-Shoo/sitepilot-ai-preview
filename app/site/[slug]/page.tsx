import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WebsiteRenderer } from "@/components/site-renderer/WebsiteRenderer";
import { AnalyticsBeacon } from "@/components/site-renderer/AnalyticsBeacon";
import { websiteBlueprintSchema } from "@/lib/validators/website-blueprint";
import { hasSupabaseCredentials } from "@/lib/runtime";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return { title: "Website" };
  }
  const { data: project } = await supabase
    .from("projects")
    .select("blueprint, business_name")
    .eq("published_slug", slug)
    .eq("status", "published")
    .maybeSingle();
  const bp = websiteBlueprintSchema.safeParse(project?.blueprint);
  if (!bp.success) {
    return { title: "Website" };
  }
  return {
    title: bp.data.seo.title || project?.business_name || "Website",
    description: bp.data.seo.description,
  };
}

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("id, blueprint, published_slug, status")
    .eq("published_slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!project) notFound();

  const parsed = websiteBlueprintSchema.safeParse(project.blueprint);
  if (!parsed.success) notFound();

  return (
    <>
      <AnalyticsBeacon projectId={project.id} />
      <WebsiteRenderer
        blueprint={parsed.data}
        projectId={project.id}
        publishedSlug={slug}
        showContactForm
      />
    </>
  );
}
