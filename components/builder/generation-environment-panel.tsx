"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { BlueprintGenerationSource } from "@/lib/openai/generate-website-blueprint";
import type { GenerationApiFailure } from "@/lib/ai/generation-api-response";

type Status = {
  demoMode: boolean;
  offlinePreview?: boolean;
  openaiKeyDetected: boolean;
  keySuffix: string | null;
  configState: "mock" | "openai" | "unconfigured";
  expectedSource: "openai" | "mock" | null;
};

const SHOW_PANEL =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "1" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

export function GenerationEnvironmentPanel({
  lastSource,
  lastError,
}: {
  lastSource?: BlueprintGenerationSource | null;
  lastError?: GenerationApiFailure | null;
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

  const readyForOpenAi =
    status && !status.demoMode && status.openaiKeyDetected && status.expectedSource === "openai";

  return (
    <Card className="rounded-xl border border-dashed border-border/60 bg-muted/20">
      <CardContent className="space-y-2 p-4 text-xs text-muted-foreground">
        <p className="font-semibold uppercase tracking-wide text-foreground">Environment</p>
        <ul className="space-y-1 font-mono">
          <li>
            Demo mode (NEXT_PUBLIC_DEMO_MODE):{" "}
            <span className={status?.demoMode ? "text-amber-400" : "text-emerald-400"}>
              {status ? (status.demoMode ? "on → mock only" : "off") : "…"}
            </span>
          </li>
          <li>
            OpenAI key detected:{" "}
            <span className={status?.openaiKeyDetected ? "text-emerald-400" : "text-amber-400"}>
              {status
                ? status.openaiKeyDetected
                  ? `yes${status.keySuffix ? ` (…${status.keySuffix})` : ""}`
                  : "no"
                : "…"}
            </span>
          </li>
          <li>
            Expected generation:{" "}
            <span className="font-semibold text-foreground">
              {status?.expectedSource ?? status?.configState ?? "…"}
            </span>
          </li>
          {status?.offlinePreview ? (
            <li className="text-muted-foreground">
              Offline preview (no Supabase) — OK for OpenAI when demo is off
            </li>
          ) : null}
          {lastSource ? (
            <li>
              Last generation source:{" "}
              <span className="font-semibold text-foreground">{lastSource}</span>
            </li>
          ) : null}
          {lastError ? (
            <li className="text-red-400">
              Last error: [{lastError.error}] {lastError.message}
            </li>
          ) : null}
        </ul>
        {readyForOpenAi ? (
          <p className="text-emerald-400">Ready for real OpenAI generation.</p>
        ) : null}
        {status?.demoMode ? (
          <p className="text-amber-400">
            Set NEXT_PUBLIC_DEMO_MODE=0 in .env.local or Vercel, then restart / redeploy.
          </p>
        ) : null}
        {status && !status.demoMode && !status.openaiKeyDetected ? (
          <p className="text-amber-400">
            Add OPENAI_API_KEY or set NEXT_PUBLIC_DEMO_MODE=1 for mock generation.
          </p>
        ) : null}
        {lastError?.details && process.env.NODE_ENV === "development" ? (
          <pre className="mt-2 max-h-32 overflow-auto rounded-lg border border-border/60 bg-background/80 p-2 text-[10px] text-red-300/90">
            {lastError.details}
          </pre>
        ) : null}
      </CardContent>
    </Card>
  );
}
