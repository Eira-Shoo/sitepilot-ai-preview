import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectWorkspace } from "@/components/dashboard/project-workspace";
import { DemoProjectShell } from "@/components/dashboard/demo-project-shell";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { hasSupabaseCredentials } from "@/lib/runtime";
import { DEMO_PROJECT_ID } from "@/lib/demo-project";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!hasSupabaseCredentials() || id === DEMO_PROJECT_ID) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Project editor</h1>
          <p className="text-sm text-muted-foreground">
            Preview your generated draft in this browser. Connect Supabase to save projects across devices.
          </p>
        </div>
        <DemoProjectShell projectId={DEMO_PROJECT_ID} status="preview" publishedSlug={null} />
      </div>
    );
  }

  const supabase = await createClient();
  if (!supabase) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("id, blueprint, status, published_slug, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Project editor</h1>
        <p className="text-sm text-muted-foreground">
          Preview, iterate with AI on JSON, and launch checkout when you are ready.
        </p>
      </div>
      <ProjectWorkspace
        projectId={project.id}
        initialBlueprint={project.blueprint as WebsiteBlueprint | null}
        status={project.status}
        publishedSlug={project.published_slug}
      />
    </div>
  );
}
