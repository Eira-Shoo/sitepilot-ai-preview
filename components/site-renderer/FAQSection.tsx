import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type F = Extract<BlueprintSection, { type: "faq" }>;
type FaqItem = { question: string; answer: string };

export function FAQSection({ section }: { section: F }) {
  return (
    <section className="py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          {section.headline}
        </h2>
        <Accordion type="single" collapsible className="mt-10 w-full">
        {section.items.map((item: FaqItem, i: number) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      </div>
    </section>
  );
}
