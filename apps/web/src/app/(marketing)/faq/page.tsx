"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Heading, useTranslation } from "@the-ride/ui";

export default function FaqPage() {
  const { t } = useTranslation();

  const items = [
    { value: "q1", question: t("website.faq.q1"), answer: t("website.faq.a1") },
    { value: "q2", question: t("website.faq.q2"), answer: t("website.faq.a2") },
    { value: "q3", question: t("website.faq.q3"), answer: t("website.faq.a3") },
    { value: "q4", question: t("website.faq.q4"), answer: t("website.faq.a4") },
  ];

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <Heading level={1} className="mb-8">
        {t("website.faq.title")}
      </Heading>
      <Accordion type="single" collapsible>
        {items.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
