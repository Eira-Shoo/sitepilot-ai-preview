"use client";

import { usePathname } from "next/navigation";

/**
 * Nur sichtbar, wenn NEXT_PUBLIC_DEMO_MODE=1 und Pfad ist Builder/Dashboard/Admin.
 * Kein Hinweis auf /, /pricing, /contact, /site/*, /preview.
 */
export function DemoRibbon() {
  const path = usePathname() ?? "";
  const inBuilderArea =
    path.startsWith("/dashboard") ||
    path.startsWith("/create") ||
    path.startsWith("/admin");

  const v = process.env.NEXT_PUBLIC_DEMO_MODE;
  const demo = v === "1" || v === "true";
  if (!inBuilderArea || !demo) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 px-4">
      <div className="pointer-events-auto rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-xs font-semibold text-amber-200 shadow-lg backdrop-blur-md">
        Demo Mode — Vorschau ohne echte API-Aufrufe
      </div>
    </div>
  );
}
