"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { BlueprintGenerationSource } from "@/lib/openai/generate-website-blueprint";

type Status = {
  demoMode: boolean;
  openaiKeyDetected: boolean;
  configState: "mock" | "openai" | "unconfigured";
  expectedSource: "openai" | "mock" | null;
};

const IS_DEMO_CLIENT =
  process.env.NEXT_PUBLIC_DEMO_MODE === "1" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const SHOW_PANEL =
  process.env.NODE_ENV === "development" ||
  IS_DEMO_CLIENT ||
  (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

export function GenerationEnvironmentPanel({
  lastSource,
}: {
  lastSource?: BlueprintGenerationSource | null;
}) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (!SHOW_PANEL) return;
    fetch("/api/ai/generation-status")
      .then((r) => r.json())
      .then((data) => setStatus(data as Status))
      .catch(() => setStatus(null));
  }, []);

  if (!SHOW_PANEL) return null;

  return (
    <Card className="rounded-xl border border-dashed border-border/60 bg-muted/20">
      <CardContent className="space-y-2 p-4 text-xs text-muted-foreground">
        <p className="font-semibold uppercase tracking-wide text-foreground">Environment</p>
        <ul className="space-y-1 font-mono">
          <li>
            Demo mode:{" "}
            <span className="text-foreground">
              {status ? (status.demoMode ? "on" : "off") : "…"}
            </span>
          </li>
          <li>
            OpenAI key detected:{" "}
            <span className="text-foreground">
              {status ? (status.openaiKeyDetected ? "yes" : "no") : "…"}
            </span>
          </li>
          <li>
            Expected generation:{" "}
            <span className="text-foreground">
              {status?.expectedSource ?? status?.configState ?? "…"}
            </span>
          </li>
          {lastSource ? (
            <li>
              Last generation source:{" "}
              <span className="font-semibold text-foreground">{lastSource}</span>
            </li>
          ) : null}
        </ul>
        {status?.configState === "unconfigured" ? (
          <p className="text-amber-400">
            OpenAI API key is missing. Add OPENAI_API_KEY to .env.local or set NEXT_PUBLIC_DEMO_MODE=1.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
