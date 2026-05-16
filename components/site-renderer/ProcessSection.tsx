import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { SectionHeader } from "./SectionHeader";
import { SECTION_CONTAINER, SECTION_PADDING } from "./section-styles";

type P = Extract<BlueprintSection, { type: "process" }>;
type ProcessStep = { title: string; description: string };

export function ProcessSection({ section }: { section: P }) {
  return (
    <section id="process" className={`border-y border-border/60 bg-muted/10 ${SECTION_PADDING}`}>
      <div className={SECTION_CONTAINER}>
        <SectionHeader label="Process" title={section.headline || "How it works"} />
        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {section.items.map((step: ProcessStep, i: number) => (
            <li
              key={i}
              className="relative rounded-3xl border border-border/60 bg-card/90 p-8 shadow-sm"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--sp-secondary,#c9a227)]/20 text-base font-bold text-[var(--sp-secondary,#c9a227)]">
                {i + 1}
              </span>
              <p className="mt-5 text-xl font-bold leading-snug">{step.title}</p>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

