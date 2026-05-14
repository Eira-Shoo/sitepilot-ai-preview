import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import Link from "next/link";

type F = Extract<BlueprintSection, { type: "footer" }>;

export function FooterSection({ section }: { section: F }) {
  return (
    <footer className="border-t border-border/60 bg-background/80 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted-foreground">{section.tagline}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          {section.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
