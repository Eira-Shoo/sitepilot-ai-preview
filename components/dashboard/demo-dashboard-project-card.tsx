"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_PROJECT_ID } from "@/lib/demo-project";
import { demoBlueprint } from "@/lib/demo-blueprint";
import { loadDemoDraft } from "@/lib/demo-session";

export function DemoDashboardProjectCard() {
  const sampleTitle = `${demoBlueprint.business.name} (sample)`;
  const [title, setTitle] = useState(sampleTitle);
  const [subtitle, setSubtitle] = useState(
    "Generate a site in the AI builder to create your own draft",
  );

  useEffect(() => {
    const draft = loadDemoDraft();
    if (draft) {
      setTitle(draft.blueprint.business.name);
      setSubtitle(
        `Your last generated draft (${draft.source === "openai" ? "OpenAI" : "mock"} · saved in this browser)`,
      );
    }
  }, []);

  return (
    <Card className="rounded-2xl border-border/60 bg-card/80">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Badge variant="muted" className="rounded-full">
          preview
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild size="sm" className="rounded-xl">
          <Link href={`/dashboard/projects/${DEMO_PROJECT_ID}`}>Open editor</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="rounded-xl">
          <Link href="/create">New from builder</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="rounded-xl">
          <Link href="/site/demo" target="_blank">
            Static /site/demo
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
