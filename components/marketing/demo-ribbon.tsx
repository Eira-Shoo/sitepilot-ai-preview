"use client";

import { usePathname } from "next/navigation";

/**
 * Visible only on builder / dashboard / admin (and /preview), never on marketing home/pricing/contact.
 * Controlled by NEXT_PUBLIC_DEMO_MODE=1 (set on Vercel for public review deploys).
 */
export function DemoRibbon() {
  const path = usePathname() ?? "";
  const inBuilderArea =
    path.startsWith("/dashboard") ||
    path.startsWith("/create") ||
    path.startsWith("/admin") ||
    path.startsWith("/preview");

  const v = process.env.NEXT_PUBLIC_DEMO_MODE;
  const demo = v === "1" || v === "true";
  if (!inBuilderArea || !demo) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 px-4">
      <div className="pointer-events-auto rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-xs font-semibold text-amber-200 shadow-lg backdrop-blur-md">
        Demo Mode — sample data only; connect Supabase and APIs to persist
      </div>
    </div>
  );
}
