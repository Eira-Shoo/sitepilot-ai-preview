"use client";

import { useEffect, useState } from "react";
import { WebsiteRenderer } from "@/components/site-renderer/WebsiteRenderer";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { demoBlueprint } from "@/lib/demo-blueprint";
import { loadDemoBlueprint } from "@/lib/demo-session";

type Props = {
  projectId: string;
  fallback?: WebsiteBlueprint;
  showContactForm?: boolean;
};

export function DemoBlueprintPreview({
  projectId,
  fallback = demoBlueprint,
  showContactForm = false,
}: Props) {
  const [blueprint, setBlueprint] = useState<WebsiteBlueprint | null>(null);

  useEffect(() => {
    setBlueprint(loadDemoBlueprint() ?? fallback);
  }, [fallback]);

  if (!blueprint) {
    return <p className="text-sm text-muted-foreground">Loading preview…</p>;
  }

  return (
    <WebsiteRenderer blueprint={blueprint} projectId={projectId} showContactForm={showContactForm} />
  );
}
