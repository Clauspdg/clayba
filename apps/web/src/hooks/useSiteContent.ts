"use client";

import {
  subscribeDriverCtaContent,
  subscribeFaqItems,
  subscribeFooterContent,
  subscribeHomepageContent,
  subscribeHowItWorksContent,
  subscribeNavigationContent,
  subscribeSafetyContent,
  subscribeSectionsContent,
  subscribeStatisticsContent,
  subscribeTestimonials,
  subscribeTrackingContent,
  subscribeVehicleCategories,
} from "@/lib/site-content";
import type { Locale } from "@the-ride/hooks";
import { useTranslation } from "@the-ride/ui";
import {
  DEFAULT_SECTIONS_ORDER,
  type BilingualText,
  type DriverCtaContent,
  type FaqCategory,
  type FaqItem,
  type FooterContent,
  type FooterLink,
  type HomepageContent,
  type HowItWorksContent,
  type NavigationContent,
  type SafetyContent,
  type SectionKey,
  type SocialLink,
  type StatisticsContent,
  type TestimonialItem,
  type TrackingContent,
  type VehicleCategory,
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
  introText: string;
  ctaPassengerLabel: string;
  ctaDriverLabel: string;
  ctaPassengerEnabled: boolean;
  ctaPassengerHref: string;
  ctaDriverEnabled: boolean;
  ctaDriverHref: string;
  backgroundDesktopImageUrl?: string;
  backgroundLaptopImageUrl?: string;
  backgroundTabletImageUrl?: string;
  backgroundMobileImageUrl?: string;
  backgroundDesktopVideoUrl?: string;
  backgroundMobileVideoUrl?: string;
  backgroundPosterImageUrl?: string;
  accentColor?: string;
  textAlign: "left" | "center";
  visible: boolean;
}

export function useHomepageContent(): HomepageContentResolved {
  const { t, locale } = useTranslation();
  const [content, setContent] = useState<HomepageContent | null>(null);

  useEffect(() => subscribeHomepageContent(setContent), []);

  return {
    eyebrow: pickText(content?.eyebrow, locale, t, "website.landing.heroEyebrow"),
    title: pickText(content?.title, locale, t, "website.landing.heroTitle"),
    subtitle: pickText(content?.subtitle, locale, t, "website.landing.heroSubtitle"),
    introText: content?.introText ? pickRawText(content.introText, locale) : "",
    ctaPassengerLabel: pickText(
      content?.ctaPassengerLabel,
      locale,
      t,
      "website.landing.ctaPassenger",
    ),
    ctaDriverLabel: pickText(content?.ctaDriverLabel, locale, t, "website.landing.ctaDriver"),
    ctaPassengerEnabled: content?.ctaPassengerEnabled ?? true,
    ctaPassengerHref: content?.ctaPassengerHref ?? "/services",
    ctaDriverEnabled: content?.ctaDriverEnabled ?? true,
    ctaDriverHref: content?.ctaDriverHref ?? "/become-a-driver",
    backgroundDesktopImageUrl: content?.backgroundDesktopImageUrl,
    backgroundLaptopImageUrl: content?.backgroundLaptopImageUrl,
    backgroundTabletImageUrl: content?.backgroundTabletImageUrl,
    backgroundMobileImageUrl: content?.backgroundMobileImageUrl,
    backgroundDesktopVideoUrl: content?.backgroundDesktopVideoUrl,
    backgroundMobileVideoUrl: content?.backgroundMobileVideoUrl,
    backgroundPosterImageUrl: content?.backgroundPosterImageUrl,
    accentColor: content?.accentColor,
    textAlign: content?.textAlign ?? "left",
    visible: content?.visible ?? true,
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

export interface ResolvedFooterLink {
  label: string;
  href: string;
}

export interface FooterContentResolved {
  logoImageUrl?: string;
  logoText?: string;
  copyrightText?: string;
  tagline: string;
  newsletterTitle: string;
  newsletterBody: string;
  showNewsletter: boolean;
  socialLinks?: ResolvedSocialLink[];
  companyLinks?: ResolvedFooterLink[];
  serviceLinks?: ResolvedFooterLink[];
  supportLinks?: ResolvedFooterLink[];
  legalLinks?: ResolvedFooterLink[];
}

function resolveLinkList(
  links: FooterLink[] | undefined,
  locale: Locale,
): ResolvedFooterLink[] | undefined {
  return links && links.length > 0
    ? links.map((link) => ({ label: pickRawText(link.label, locale), href: link.href }))
    : undefined;
}

export function useFooterContent(): FooterContentResolved {
  const { t, locale } = useTranslation();
  const [content, setContent] = useState<FooterContent | null>(null);

  useEffect(() => subscribeFooterContent(setContent), []);

  return {
    logoImageUrl: content?.logoImageUrl,
    logoText: content?.logoText,
    copyrightText: content?.copyrightText ? pickRawText(content.copyrightText, locale) : undefined,
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
    companyLinks: resolveLinkList(content?.companyLinks, locale),
    serviceLinks: resolveLinkList(content?.serviceLinks, locale),
    supportLinks: resolveLinkList(content?.supportLinks, locale),
    legalLinks: resolveLinkList(content?.legalLinks, locale),
  };
}

export interface ResolvedTestimonial {
  name: string;
  role: string;
  city: string;
  country?: string;
  photoUrl?: string;
  trips: number;
  quote: string;
  rating: number;
}

/** Filters out `active: false` items on read — publishing still copies the whole list, so a testimonial can be hidden and later re-shown without losing its content (Sprint 8.3). */
export function useTestimonials(fallback: ResolvedTestimonial[]): ResolvedTestimonial[] {
  const { locale } = useTranslation();
  const [items, setItems] = useState<TestimonialItem[]>([]);

  useEffect(() => subscribeTestimonials(setItems), []);

  const active = items.filter((item) => item.active !== false);
  if (active.length === 0) return fallback;
  return active.map((item) => ({
    name: item.name,
    role: pickRawText(item.role, locale),
    city: item.city,
    country: item.country,
    photoUrl: item.photoUrl,
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

export interface ResolvedProcessStep {
  icon: string;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface HowItWorksContentResolved {
  eyebrow: string;
  title: string;
  steps: ResolvedProcessStep[];
}

/** All-or-nothing on `steps` (a list, same rationale as testimonials/FAQ) — `fallbackSteps` is today's 3 hardcoded steps. */
export function useHowItWorksContent(
  fallbackSteps: ResolvedProcessStep[],
): HowItWorksContentResolved {
  const { t, locale } = useTranslation();
  const [content, setContent] = useState<HowItWorksContent | null>(null);

  useEffect(() => subscribeHowItWorksContent(setContent), []);

  const steps =
    content && content.items.length > 0
      ? content.items.map((step) => ({
          icon: step.icon,
          title: pickRawText(step.title, locale),
          description: pickRawText(step.description, locale),
          imageUrl: step.imageUrl,
        }))
      : fallbackSteps;

  return {
    eyebrow: pickText(content?.eyebrow, locale, t, "website.landing.howItWorksEyebrow"),
    title: pickText(content?.title, locale, t, "website.landing.howItWorksTitle"),
    steps,
  };
}

export interface ResolvedSafetyCard {
  icon: string;
  title: string;
  description: string;
  badgeText: string;
}

export interface SafetyContentResolved {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  cards: ResolvedSafetyCard[];
}

/** All-or-nothing on `cards` (a list) — `fallbackCards` is today's 3 hardcoded safety features. */
export function useSafetyContent(fallbackCards: ResolvedSafetyCard[]): SafetyContentResolved {
  const { t, locale } = useTranslation();
  const [content, setContent] = useState<SafetyContent | null>(null);

  useEffect(() => subscribeSafetyContent(setContent), []);

  const cards =
    content && content.items.length > 0
      ? content.items.map((card) => ({
          icon: card.icon,
          title: pickRawText(card.title, locale),
          description: pickRawText(card.description, locale),
          badgeText: pickRawText(card.badgeText, locale),
        }))
      : fallbackCards;

  return {
    eyebrow: pickText(content?.eyebrow, locale, t, "website.landing.safetyEyebrow"),
    title: pickText(content?.title, locale, t, "website.landing.safetyTitle"),
    subtitle: pickText(content?.subtitle, locale, t, "website.landing.safetySubtitle"),
    ctaLabel: pickText(content?.ctaLabel, locale, t, "website.landing.safetyCta"),
    ctaHref: content?.ctaHref ?? "/safety",
    cards,
  };
}

export interface DriverCtaContentResolved {
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonHref: string;
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
}

export function useDriverCtaContent(): DriverCtaContentResolved {
  const { t, locale } = useTranslation();
  const [content, setContent] = useState<DriverCtaContent | null>(null);

  useEffect(() => subscribeDriverCtaContent(setContent), []);

  return {
    title: pickText(content?.title, locale, t, "website.landing.driverCtaTitle"),
    subtitle: pickText(content?.subtitle, locale, t, "website.landing.driverCtaBody"),
    buttonLabel: pickText(content?.buttonLabel, locale, t, "website.landing.driverCtaButton"),
    buttonHref: content?.buttonHref ?? "/become-a-driver",
    backgroundImageUrl: content?.backgroundImageUrl,
    backgroundVideoUrl: content?.backgroundVideoUrl,
  };
}

/**
 * Ride Categories (Sprint 7.2) — reads the real `vehicleCategories`
 * collection (see `apps/web/src/lib/site-content.ts`'s comment for why
 * there's no separate CMS-only copy). `name`/`description` on that schema
 * are plain strings, not bilingual — shown as-is regardless of locale.
 * All-or-nothing fallback like the other lists here.
 */
export function useVehicleCategories(fallback: VehicleCategory[]): VehicleCategory[] {
  const [items, setItems] = useState<VehicleCategory[]>([]);

  useEffect(() => subscribeVehicleCategories(setItems), []);

  return items.length > 0 ? items : fallback;
}

export interface ResolvedStatistic {
  value: string;
  label: string;
}

/** All-or-nothing on `items` (a list) — `fallback` is today's 4 hardcoded homepage stats (Sprint 8.3). */
export function useStatisticsContent(fallback: ResolvedStatistic[]): ResolvedStatistic[] {
  const { locale } = useTranslation();
  const [content, setContent] = useState<StatisticsContent | null>(null);

  useEffect(() => subscribeStatisticsContent(setContent), []);

  if (!content || content.items.length === 0) return fallback;
  return content.items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item) => ({ value: item.value, label: pickRawText(item.label, locale) }));
}

export interface TrackingContentResolved {
  eyebrow: string;
  title: string;
  subtitle: string;
  distanceValue: string;
  etaValue: string;
  points: string[];
}

/**
 * `distanceValue`/`etaValue` stay simulated illustrative strings — no real
 * Maps API in this environment (Sprint 8.3, same disclosure as
 * `MapPreview.tsx`'s own comment), now editable instead of hardcoded.
 */
export function useTrackingContent(fallback: TrackingContentResolved): TrackingContentResolved {
  const { t, locale } = useTranslation();
  const [content, setContent] = useState<TrackingContent | null>(null);

  useEffect(() => subscribeTrackingContent(setContent), []);

  return {
    eyebrow: pickText(content?.eyebrow, locale, t, "website.landing.mapEyebrow"),
    title: pickText(content?.title, locale, t, "website.landing.mapTitle"),
    subtitle: pickText(content?.subtitle, locale, t, "website.landing.mapSubtitle"),
    distanceValue: content?.distanceValue ?? fallback.distanceValue,
    etaValue: content?.etaValue ?? fallback.etaValue,
    points:
      content && content.points.length > 0
        ? content.points
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((point) => pickRawText(point.text, locale))
        : fallback.points,
  };
}

export interface ResolvedNavigationItem {
  label: string;
  href: string;
}

export interface NavigationContentResolved {
  logoImageUrl?: string;
  logoText?: string;
  items?: ResolvedNavigationItem[];
}

/** Empty/unpublished `items` means "use the site's own hardcoded 5-link nav" — see `SiteHeader.tsx`. */
export function useNavigationContent(): NavigationContentResolved {
  const { locale } = useTranslation();
  const [content, setContent] = useState<NavigationContent | null>(null);

  useEffect(() => subscribeNavigationContent(setContent), []);

  const visibleItems = (content?.items ?? [])
    .filter((item) => item.visible)
    .slice()
    .sort((a, b) => a.order - b.order);

  return {
    logoImageUrl: content?.logoImageUrl,
    logoText: content?.logoText,
    items:
      visibleItems.length > 0
        ? visibleItems.map((item) => ({ label: pickRawText(item.label, locale), href: item.href }))
        : undefined,
  };
}
