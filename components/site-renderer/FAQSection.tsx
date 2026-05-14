import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type F = Extract<BlueprintSection, { type: "faq" }>;

export function FAQSection({ section }: { section: F }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h2 className="text-center text-3xl font-semibold tracking-tight">
        {section.headline}
      </h2>
      <Accordion type="single" collapsible className="mt-8 w-full">
        {section.items.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
