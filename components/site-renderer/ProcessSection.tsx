import type { BlueprintSection } from "@/lib/validators/website-blueprint";

type P = Extract<BlueprintSection, { type: "process" }>;
type ProcessStep = { title: string; description: string };

export function ProcessSection({ section }: { section: P }) {
  return (
    <section className="border-y border-border/60 bg-muted/15 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          {section.headline}
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {section.items.map((step: ProcessStep, i: number) => (
            <li
              key={i}
              className="relative rounded-2xl border border-border/60 bg-card/70 p-6"
            >
              <span className="text-xs font-semibold text-primary">Step {i + 1}</span>
              <p className="mt-2 text-lg font-semibold">{step.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
