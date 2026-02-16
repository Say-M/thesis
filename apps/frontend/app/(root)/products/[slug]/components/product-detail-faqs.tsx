"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FaqItem = { question: string; answer: string };

type ProductDetailFaqsProps = {
  faqs: FaqItem[];
};

export function ProductDetailFaqs({ faqs }: ProductDetailFaqsProps) {
  if (!faqs?.length) return null;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">
        Frequently Asked Questions
      </h2>
      <Accordion type="single" collapsible className="border rounded-lg">
        {faqs.map((faq, idx) => (
          <AccordionItem
            key={idx}
            value={`faq-${idx}`}
            className="border-b px-4 last:border-b-0"
          >
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
