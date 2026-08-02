"use client";

import { useFaqItems, type ResolvedFaqItem } from "@/hooks/useSiteContent";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  EmptyState,
  Illustration,
  SearchBar,
  useTranslation,
} from "@the-ride/ui";
import type { FaqCategory } from "@the-ride/types";
import { useMemo, useState } from "react";

import { Hero } from "@/components/marketing/Hero";

export default function FaqPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FaqCategory | "all">("all");

  const DEFAULT_FAQ_ITEMS: ResolvedFaqItem[] = [
    {
      value: "general-1",
      category: "general",
      question: t("website.faq.q1"),
      answer: t("website.faq.a1"),
    },
    {
      value: "general-2",
      category: "general",
      question: t("website.faq.q2"),
      answer: t("website.faq.a2"),
    },
    {
      value: "booking-1",
      category: "booking",
      question: t("website.faq.q3"),
      answer: t("website.faq.a3"),
    },
    {
      value: "booking-2",
      category: "booking",
      question: t("website.faq.qBooking2"),
      answer: t("website.faq.aBooking2"),
    },
    {
      value: "booking-3",
      category: "booking",
      question: t("website.faq.qBooking3"),
      answer: t("website.faq.aBooking3"),
    },
    {
      value: "payments-1",
      category: "payments",
      question: t("website.faq.q4"),
      answer: t("website.faq.a4"),
    },
    {
      value: "payments-2",
      category: "payments",
      question: t("website.faq.qPayments2"),
      answer: t("website.faq.aPayments2"),
    },
    {
      value: "safety-1",
      category: "safety",
      question: t("website.faq.qSafety1"),
      answer: t("website.faq.aSafety1"),
    },
    {
      value: "safety-2",
      category: "safety",
      question: t("website.faq.qSafety2"),
      answer: t("website.faq.aSafety2"),
    },
    {
      value: "drivers-1",
      category: "drivers",
      question: t("website.faq.qDrivers1"),
      answer: t("website.faq.aDrivers1"),
    },
    {
      value: "drivers-2",
      category: "drivers",
      question: t("website.faq.qDrivers2"),
      answer: t("website.faq.aDrivers2"),
    },
  ];
  const items = useFaqItems(DEFAULT_FAQ_ITEMS);

  const categories: Array<FaqCategory | "all"> = [
    "all",
    "general",
    "booking",
    "payments",
    "safety",
    "drivers",
  ];

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesSearch =
        !needle ||
        item.question.toLowerCase().includes(needle) ||
        item.answer.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [items, search, category]);

  return (
    <div>
      <Hero className="px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="tablet:text-5xl text-4xl font-bold text-white">
            {t("website.faq.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-300">
            {t("website.faq.subtitle")}
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <SearchBar
              label={t("website.faq.searchLabel")}
              placeholder={t("website.faq.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Hero>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={
                category === cat
                  ? "bg-brand rounded-full px-4 py-1.5 text-sm font-medium text-white transition-colors"
                  : "hover:border-brand hover:text-brand rounded-full border border-neutral-200 px-4 py-1.5 text-sm font-medium text-neutral-600 transition-colors dark:border-neutral-700 dark:text-neutral-300"
              }
            >
              {t(`website.faq.category.${cat}`)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Illustration name="empty" size={80} />}
            title={t("website.faq.noResults")}
          />
        ) : (
          <Accordion
            type="single"
            collapsible
            className="shadow-elevation1 rounded-2xl border border-neutral-100 bg-white px-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            {filtered.map((item) => (
              <AccordionItem key={item.value} value={item.value}>
                <AccordionTrigger>
                  <span className="flex items-center gap-3">
                    <Badge tone="neutral" size="sm">
                      {t(`website.faq.category.${item.category}`)}
                    </Badge>
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>
    </div>
  );
}
