import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { hasSupabaseCredentials } from "@/lib/runtime";
import { DEMO_PROJECT_ID } from "@/lib/demo-project";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  if (!hasSupabaseCredentials()) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Admin tools require Supabase. In this public preview you can still open the sample admin project
          below (read-only mock).
        </p>
        <Button asChild className="rounded-xl">
          <Link href={`/admin/projects/${DEMO_PROJECT_ID}`}>Sample admin project</Link>
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return null;
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, business_name, status, package_type, updated_at, published_slug, user_id")
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Review projects, approve blueprints, publish to `/site/[slug]`, and monitor operational signals.
        </p>
      </div>
      <div className="grid gap-4">
        {projects?.map((p) => (
          <Card key={p.id} className="rounded-2xl border-border/60 bg-card/80">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{p.business_name ?? "Untitled"}</CardTitle>
                <p className="text-xs text-muted-foreground">{p.id}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm" className="rounded-xl">
                  <Link href={`/admin/projects/${p.id}`}>Open</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link href={`/dashboard/projects/${p.id}`}>Customer view</Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
