"use client";

import { useEffect, useState } from "react";
import { ProjectWorkspace } from "@/components/dashboard/project-workspace";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { demoBlueprint } from "@/lib/demo-blueprint";
import { loadDemoBlueprint, saveDemoBlueprint } from "@/lib/demo-session";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  projectId: string;
  status?: string;
  publishedSlug?: string | null;
};

export function DemoProjectShell({
  projectId,
  status = "preview",
  publishedSlug = null,
}: Props) {
  const [blueprint, setBlueprint] = useState<WebsiteBlueprint | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadDemoBlueprint();
    setBlueprint(stored ?? demoBlueprint);
    setReady(true);
  }, []);

  function handleBlueprintUpdate(next: WebsiteBlueprint) {
    setBlueprint(next);
    saveDemoBlueprint(next);
  }

  if (!ready || !blueprint) {
    return (
      <Card className="rounded-2xl border-border/60 bg-card/80">
        <CardContent className="p-6 text-sm text-muted-foreground">Loading preview…</CardContent>
      </Card>
    );
  }

  return (
    <ProjectWorkspace
      projectId={projectId}
      initialBlueprint={blueprint}
      status={status}
      publishedSlug={publishedSlug}
      onBlueprintUpdate={handleBlueprintUpdate}
      isDemoPreview
    />
  );
}
