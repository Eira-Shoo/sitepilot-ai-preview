import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WebsiteRenderer } from "@/components/site-renderer/WebsiteRenderer";
import { DemoBlueprintPreview } from "@/components/dashboard/demo-blueprint-preview";
import { websiteBlueprintSchema } from "@/lib/validators/website-blueprint";
import { approveProject, markProjectPaid, publishProject } from "./actions";
import { hasSupabaseCredentials } from "@/lib/runtime";
import { DEMO_PROJECT_ID } from "@/lib/demo-project";

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!hasSupabaseCredentials() || id === DEMO_PROJECT_ID) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Admin (preview)</p>
            <h1 className="text-3xl font-semibold tracking-tight">Demo project</h1>
            <p className="text-sm text-muted-foreground">
              Actions are disabled until Supabase is configured. Preview uses your last generated draft
              from the builder when available.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin">All projects</Link>
          </Button>
        </div>
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden rounded-2xl border border-border/60">
            <DemoBlueprintPreview projectId={DEMO_PROJECT_ID} showContactForm={false} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  if (!supabase) notFound();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!project) notFound();

  const { data: inputs } = await supabase
    .from("project_inputs")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const { data: contacts } = await supabase
    .from("contact_submissions")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: events } = await supabase
    .from("analytics_events")
    .select("event_name")
    .eq("project_id", id)
    .limit(500);

  const { data: recs } = await supabase
    .from("ai_recommendations")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const blueprintParsed = websiteBlueprintSchema.safeParse(project.blueprint);
  const blueprint = blueprintParsed.success ? blueprintParsed.data : null;

  const eventCounts: Record<string, number> = {};
  for (const e of events ?? []) {
    eventCounts[e.event_name] = (eventCounts[e.event_name] ?? 0) + 1;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {project.business_name ?? project.name}
          </h1>
          <p className="text-sm text-muted-foreground">Project {project.id}</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/admin">All projects</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <form action={approveProject}>
          <input type="hidden" name="projectId" value={project.id} />
          <Button type="submit" className="rounded-xl">
            Approve website
          </Button>
        </form>
        <form action={publishProject}>
          <input type="hidden" name="projectId" value={project.id} />
          <Button type="submit" variant="secondary" className="rounded-xl">
            Publish to /site/[slug]
          </Button>
        </form>
        <form action={markProjectPaid}>
          <input type="hidden" name="projectId" value={project.id} />
          <Button type="submit" variant="outline" className="rounded-xl">
            Mark paid (manual)
          </Button>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Latest onboarding input</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-80 overflow-auto rounded-xl bg-background/60 p-3 text-xs text-muted-foreground">
              {JSON.stringify(inputs?.form_data ?? {}, null, 2)}
            </pre>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Stripe payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {(payments ?? []).length ? (
              payments?.map((p) => (
                <div key={p.id} className="rounded-xl border border-border/60 p-3">
                  <p className="text-foreground">
                    {p.status} · {(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
                  </p>
                  <p className="text-xs">{p.stripe_session_id}</p>
                </div>
              ))
            ) : (
              <p>No payments recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Contact submissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(contacts ?? []).length ? (
            contacts?.map((c) => (
              <div key={c.id} className="rounded-xl border border-border/60 p-3">
                <p className="font-medium text-foreground">{c.name}</p>
                <p className="text-muted-foreground">{c.email}</p>
                <p className="mt-2 text-muted-foreground">{c.message}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No submissions yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Analytics (recent sample)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <pre className="rounded-xl bg-background/60 p-3 text-xs text-foreground">
            {JSON.stringify(eventCounts, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>AI recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {(recs ?? []).length ? (
            recs?.map((r) => (
              <div key={r.id} className="rounded-xl border border-border/60 p-3">
                <p className="font-medium text-foreground">{r.title}</p>
                <p className="text-muted-foreground">{r.description}</p>
                <p className="text-xs text-muted-foreground">
                  {r.recommendation_type} · {r.priority} · {r.status}
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No recommendations yet.</p>
          )}
        </CardContent>
      </Card>

      {blueprint ? (
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden rounded-2xl border border-border/60">
            <WebsiteRenderer
              blueprint={blueprint}
              projectId={project.id}
              publishedSlug={project.published_slug ?? undefined}
              showContactForm
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Blueprint missing or invalid.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
