import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hasSupabaseCredentials } from "@/lib/runtime";
import { DEMO_PROJECT_ID } from "@/lib/demo-project";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const offline = !hasSupabaseCredentials();
  const supabase = await createClient();

  if (offline) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My projects</h1>
          <p className="text-sm text-muted-foreground">
            Public preview: sample project below. Add Supabase env vars on Vercel for real accounts and data.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl border-border/60 bg-card/80">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Northline Beauty Studio (sample)</CardTitle>
                <p className="text-xs text-muted-foreground">Offline blueprint</p>
              </div>
              <Badge variant="muted" className="rounded-full">
                preview
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-xl">
                <Link href={`/dashboard/projects/${DEMO_PROJECT_ID}`}>Open</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <Link href="/site/demo" target="_blank">
                  Public /site/demo
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, business_name, status, updated_at, published_slug")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My projects</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.email}. Open a project to preview, chat-edit the blueprint, and checkout.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {projects?.map((p) => (
          <Card key={p.id} className="rounded-2xl border-border/60 bg-card/80">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>{p.business_name ?? p.name ?? "Untitled"}</CardTitle>
                <p className="text-xs text-muted-foreground">Updated {p.updated_at}</p>
              </div>
              <Badge variant="muted" className="rounded-full capitalize">
                {p.status}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-xl">
                <Link href={`/dashboard/projects/${p.id}`}>Open</Link>
              </Button>
              {p.published_slug ? (
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link href={`/site/${p.published_slug}`} target="_blank">
                    Live site
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
        {!projects?.length ? (
          <Card className="rounded-2xl border-dashed border-border/60 bg-card/40 md:col-span-2">
            <CardContent className="p-8 text-sm text-muted-foreground">
              No projects yet.{" "}
              <Link href="/create" className="text-primary hover:underline">
                Start the AI builder
              </Link>
              .
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
