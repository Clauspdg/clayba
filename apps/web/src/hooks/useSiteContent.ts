"use client";

import {
  subscribeFaqItems,
  subscribeFooterContent,
  subscribeHomepageContent,
  subscribeSectionsContent,
  subscribeTestimonials,
} from "@/lib/site-content";
import type { Locale } from "@the-ride/hooks";
import { useTranslation } from "@the-ride/ui";
import {
  DEFAULT_SECTIONS_ORDER,
  type BilingualText,
  type FaqCategory,
  type FaqItem,
  type FooterContent,
  type HomepageContent,
  type SectionKey,
  type SocialLink,
  type TestimonialItem,
} from "@the-ride/types";
import { useEffect, useState } from "react";

/**
 * Public-site content hooks for the Site Content CMS (Sprint 7.1). Every
 * hook here resolves already-locale-specific plain values — the marketing
 * components never see a raw `{fr, en}` shape, only the admin editors do.
 * Singleton fields (Hero, Footer) merge per-field with the existing static
 * i18n copy as a fallback, so a partially-configured CMS doesn't blank out
 * fields nobody has published yet; list content (testimonials, FAQ) swaps
 * the whole list at once, since there's no per-item fallback to merge on.
 */

function pickText(
  field: BilingualText | undefined,
  locale: Locale,
  t: (key: string) => string,
  fallbackKey: string,
): string {
  const value = field?.[locale];
  return value && value.trim().length > 0 ? value : t(fallbackKey);
}

function pickRawText(field: BilingualText, locale: Locale): string {
  return field[locale]?.trim() ? field[locale] : field.fr || field.en || "";
}

export interface HomepageContentResolved {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaPassengerLabel: string;
  ctaDriverLabel: string;
  backgroundType: "gradient" | "image" | "video";
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
}

export function useHomepageContent(): HomepageContentResolved {
  const { t, locale } = useTranslation();
  const [content, setContent] = useState<HomepageContent | null>(null);

  useEffect(() => subscribeHomepageContent(setContent), []);

  return {
    eyebrow: pickText(content?.eyebrow, locale, t, "website.landing.heroEyebrow"),
    title: pickText(content?.title, locale, t, "website.landing.heroTitle"),
    subtitle: pickText(content?.subtitle, locale, t, "website.landing.heroSubtitle"),
    ctaPassengerLabel: pickText(
      content?.ctaPassengerLabel,
      locale,
      t,
      "website.landing.ctaPassenger",
    ),
    ctaDriverLabel: pickText(content?.ctaDriverLabel, locale, t, "website.landing.ctaDriver"),
    backgroundType: content?.backgroundType ?? "gradient",
    backgroundImageUrl: content?.backgroundImageUrl,
    backgroundVideoUrl: content?.backgroundVideoUrl,
  };
}

/** Ordered, filtered list of enabled section keys — defaults to every section enabled in the site's original fixed order when nothing has been published yet. */
export function useSectionsContent(): SectionKey[] {
  const [content, setContent] = useState<{
    items: { key: SectionKey; enabled: boolean; order: number }[];
  } | null>(null);

  useEffect(() => subscribeSectionsContent(setContent), []);

  if (!content || content.items.length === 0) return [...DEFAULT_SECTIONS_ORDER];
  return [...content.items]
    .filter((item) => item.enabled)
    .sort((a, b) => a.order - b.order)
    .map((item) => item.key);
}

export interface ResolvedSocialLink {
  icon: string;
  label: string;
  href: string;
}

export interface FooterContentResolved {
  tagline: string;
  newsletterTitle: string;
  newsletterBody: string;
  showNewsletter: boolean;
  socialLinks?: ResolvedSocialLink[];
}

export function useFooterContent(): FooterContentResolved {
  const { t, locale } = useTranslation();
  const [content, setContent] = useState<FooterContent | null>(null);

  useEffect(() => subscribeFooterContent(setContent), []);

  return {
    tagline: pickText(content?.tagline, locale, t, "footer.tagline"),
    newsletterTitle: pickText(content?.newsletterTitle, locale, t, "footer.newsletterTitle"),
    newsletterBody: pickText(content?.newsletterBody, locale, t, "footer.newsletterBody"),
    showNewsletter: content?.showNewsletter ?? true,
    socialLinks:
      content && content.socialLinks.length > 0
        ? content.socialLinks.map((link: SocialLink) => ({
            icon: link.icon,
            label: pickRawText(link.label, locale),
            href: link.href,
          }))
        : undefined,
  };
}

export interface ResolvedTestimonial {
  name: string;
  role: string;
  city: string;
  trips: number;
  quote: string;
  rating: number;
}

export function useTestimonials(fallback: ResolvedTestimonial[]): ResolvedTestimonial[] {
  const { locale } = useTranslation();
  const [items, setItems] = useState<TestimonialItem[]>([]);

  useEffect(() => subscribeTestimonials(setItems), []);

  if (items.length === 0) return fallback;
  return items.map((item) => ({
    name: item.name,
    role: pickRawText(item.role, locale),
    city: item.city,
    trips: item.trips,
    quote: pickRawText(item.quote, locale),
    rating: item.rating,
  }));
}

export interface ResolvedFaqItem {
  value: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export function useFaqItems(fallback: ResolvedFaqItem[]): ResolvedFaqItem[] {
  const { locale } = useTranslation();
  const [items, setItems] = useState<FaqItem[]>([]);

  useEffect(() => subscribeFaqItems(setItems), []);

  if (items.length === 0) return fallback;
  return items.map((item) => ({
    value: item.id,
    category: item.category,
    question: pickRawText(item.question, locale),
    answer: pickRawText(item.answer, locale),
  }));
}
