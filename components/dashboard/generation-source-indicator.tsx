"use client";

import { Badge } from "@/components/ui/badge";
import type { BlueprintGenerationSource } from "@/lib/openai/generate-website-blueprint";

const IS_DEMO_CLIENT =
  process.env.NEXT_PUBLIC_DEMO_MODE === "1" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function GenerationSourceIndicator({
  source,
}: {
  source: BlueprintGenerationSource | null | undefined;
}) {
  const show =
    process.env.NODE_ENV === "development" ||
    IS_DEMO_CLIENT ||
    (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

  if (!show || !source) return null;

  const label = source === "openai" ? "openai" : "mock";

  return (
    <Badge
      variant={source === "openai" ? "default" : "muted"}
      className="rounded-full font-mono text-[10px] uppercase tracking-wide"
    >
      Generation source: {label}
    </Badge>
  );
}
