"use client";

import { useEffect, useState } from "react";
import { ProjectWorkspace } from "@/components/dashboard/project-workspace";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import type { BlueprintGenerationSource } from "@/lib/openai/generate-website-blueprint";
import { demoBlueprint } from "@/lib/demo-blueprint";
import { loadDemoDraft, saveDemoDraft } from "@/lib/demo-session";
import { Card, CardContent } from "@/components/ui/card";
import { GenerationEnvironmentPanel } from "@/components/builder/generation-environment-panel";

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
  const [generationSource, setGenerationSource] = useState<BlueprintGenerationSource | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadDemoDraft();
    if (stored) {
      setBlueprint(stored.blueprint);
      setGenerationSource(stored.source);
    } else {
      setBlueprint(demoBlueprint);
      setGenerationSource("mock");
    }
    setReady(true);
  }, []);

  function handleBlueprintUpdate(next: WebsiteBlueprint) {
    setBlueprint(next);
    saveDemoDraft(next, generationSource ?? "mock");
  }

  if (!ready || !blueprint) {
    return (
      <Card className="rounded-2xl border-border/60 bg-card/80">
        <CardContent className="p-6 text-sm text-muted-foreground">Loading preview…</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <GenerationEnvironmentPanel lastSource={generationSource} />
      <ProjectWorkspace
        projectId={projectId}
        initialBlueprint={blueprint}
        status={status}
        publishedSlug={publishedSlug}
        onBlueprintUpdate={handleBlueprintUpdate}
        isDemoPreview
        generationSource={generationSource}
      />
    </div>
  );
}
