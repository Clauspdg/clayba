import { z } from "zod";

/**
 * Source of truth for the Site Content CMS (Sprint 7.1). Every editable text
 * field on the public marketing site carries both FR and EN copy so an admin
 * edits both languages together, in one place — no `.min(1)` here, since a
 * draft may legitimately be incomplete; only `publish()` moves a doc from
 * `siteContentDrafts` to `siteContent`, and this sprint doesn't block that
 * operation on completeness (a deliberate MVP simplification).
 */
export const bilingualTextSchema = z.object({
  fr: z.string(),
  en: z.string(),
});

export type BilingualText = z.infer<typeof bilingualTextSchema>;

/**
 * `siteContent/homepage` / `siteContentDrafts/homepage` — the Hero singleton.
 * Leaving every `background*Url` field unset means "use the existing
 * hand-crafted animated treatment," matching what `Hero.tsx` renders today
 * with zero CMS data — an admin has to deliberately upload a background to
 * replace it (Sprint 7.2 note: fields below replaced the Sprint 7.1
 * single `backgroundType`/`backgroundImageUrl`/`backgroundVideoUrl` trio
 * with per-breakpoint variants — safe to redefine since no homepage doc
 * had ever been published in the live project).
 */
export const homepageContentSchema = z.object({
  eyebrow: bilingualTextSchema,
  title: bilingualTextSchema,
  subtitle: bilingualTextSchema,
  /** "Texte d'introduction" (Sprint 8.3) — optional, renders below the subtitle when set. */
  introText: bilingualTextSchema.optional(),
  ctaPassengerLabel: bilingualTextSchema,
  ctaDriverLabel: bilingualTextSchema,
  ctaPassengerEnabled: z.boolean().default(true),
  ctaPassengerHref: z.string().default("/services"),
  ctaDriverEnabled: z.boolean().default(true),
  ctaDriverHref: z.string().default("/become-a-driver"),
  /**
   * Per-breakpoint Hero background (Sprint 7.2, extended with a laptop
   * tier in Sprint 8.3 to match the real Tailwind/`useBreakpoint` scale
   * apps/web already uses elsewhere). Falls back from
   * mobile -> tablet -> laptop -> desktop when a smaller breakpoint's
   * asset isn't set, then to the existing hand-crafted gradient treatment
   * when nothing at all is configured — see
   * `apps/web/src/components/marketing/Hero.tsx`.
   */
  backgroundDesktopImageUrl: z.string().url().optional(),
  backgroundLaptopImageUrl: z.string().url().optional(),
  backgroundTabletImageUrl: z.string().url().optional(),
  backgroundMobileImageUrl: z.string().url().optional(),
  backgroundDesktopVideoUrl: z.string().url().optional(),
  backgroundMobileVideoUrl: z.string().url().optional(),
  backgroundPosterImageUrl: z.string().url().optional(),
  /** Optional accent color override (hex) for the Hero's badge/button — falls back to the site's default brand color when unset (Sprint 8.3). */
  accentColor: z.string().optional(),
  textAlign: z.enum(["left", "center"]).default("left"),
  /** Whole-Hero show/hide (Sprint 8.3) — distinct from `sectionsContentSchema`, which never included the Hero. */
  visible: z.boolean().default(true),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type HomepageContent = z.infer<typeof homepageContentSchema>;

/**
 * `siteContent/sections` — enable/disable + display order for the eight
 * toggleable sections that follow the Hero on the public homepage. These
 * keys are exactly the eight post-Hero `<section>` blocks in
 * `apps/web/src/app/page.tsx`; the Hero itself is not a toggleable section.
 */
export const sectionKeySchema = z.enum([
  "stats",
  "vehicleTypes",
  "mapPreview",
  "howItWorks",
  "safety",
  "testimonials",
  "mobileApp",
  "driverCta",
]);

export type SectionKey = z.infer<typeof sectionKeySchema>;

export const sectionConfigSchema = z.object({
  key: sectionKeySchema,
  enabled: z.boolean().default(true),
  order: z.number().int().min(0),
});

export type SectionConfig = z.infer<typeof sectionConfigSchema>;

export const sectionsContentSchema = z.object({
  items: z.array(sectionConfigSchema),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type SectionsContent = z.infer<typeof sectionsContentSchema>;

/**
 * `siteContent/statistics` — the four homepage stat callouts (Sprint 8.3).
 * `value` stays a plain string (e.g. "250K+") since it's a styled label,
 * not a number to compute with; feeds
 * `apps/web/src/components/marketing/StatsSection.tsx`.
 */
export const statisticItemSchema = z.object({
  id: z.string().min(1),
  value: z.string().min(1),
  label: bilingualTextSchema,
  order: z.number().int().min(0),
});

export type StatisticItem = z.infer<typeof statisticItemSchema>;

export const statisticsContentSchema = z.object({
  items: z.array(statisticItemSchema),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type StatisticsContent = z.infer<typeof statisticsContentSchema>;

/**
 * `siteContent/tracking` — the GPS/live-tracking section (Sprint 8.3).
 * `distanceValue`/`etaValue` stay plain strings (e.g. "12.4 km"), mirroring
 * the simulated-data disclosure already established in
 * `apps/web/src/components/marketing/MapPreview.tsx` (no real Maps API in
 * this environment) — now editable instead of hardcoded.
 */
export const trackingPointSchema = z.object({
  id: z.string().min(1),
  text: bilingualTextSchema,
  order: z.number().int().min(0),
});

export type TrackingPoint = z.infer<typeof trackingPointSchema>;

export const trackingContentSchema = z.object({
  eyebrow: bilingualTextSchema,
  title: bilingualTextSchema,
  subtitle: bilingualTextSchema,
  distanceValue: z.string().default("12.4 km"),
  etaValue: z.string().default("18 min"),
  points: z.array(trackingPointSchema),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type TrackingContent = z.infer<typeof trackingContentSchema>;

/**
 * `siteContent/howItWorks` — the "How it works" step list (Sprint 7.2).
 * Same singleton-doc-holding-an-ordered-array shape as `sectionsContentSchema`,
 * feeding `apps/web/src/components/marketing/ProcessSteps.tsx`.
 */
export const howItWorksStepSchema = z.object({
  id: z.string().min(1),
  /** `@the-ride/ui` icon registry key — plain string, same rationale as `socialLinkSchema.icon`. */
  icon: z.string().min(1),
  title: bilingualTextSchema,
  description: bilingualTextSchema,
  /** Optional per-step illustration (Sprint 8.3) — rendered as a small thumbnail alongside the icon when set. */
  imageUrl: z.string().url().optional(),
  order: z.number().int().min(0),
});

export type HowItWorksStep = z.infer<typeof howItWorksStepSchema>;

export const howItWorksContentSchema = z.object({
  eyebrow: bilingualTextSchema,
  title: bilingualTextSchema,
  items: z.array(howItWorksStepSchema),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type HowItWorksContent = z.infer<typeof howItWorksContentSchema>;

/**
 * `siteContent/safety` — the Safety section's cards + single CTA
 * (Sprint 7.2). Feeds the inline safety-section JSX in `apps/web/src/app/page.tsx`.
 */
export const safetyCardSchema = z.object({
  id: z.string().min(1),
  icon: z.string().min(1),
  title: bilingualTextSchema,
  description: bilingualTextSchema,
  badgeText: bilingualTextSchema,
  order: z.number().int().min(0),
});

export type SafetyCard = z.infer<typeof safetyCardSchema>;

export const safetyContentSchema = z.object({
  eyebrow: bilingualTextSchema,
  title: bilingualTextSchema,
  subtitle: bilingualTextSchema,
  ctaLabel: bilingualTextSchema,
  ctaHref: z.string().default("/safety"),
  items: z.array(safetyCardSchema),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type SafetyContent = z.infer<typeof safetyContentSchema>;

/**
 * `siteContent/driverCta` — the "become a driver" call-to-action banner
 * (Sprint 7.2). Background image/video use the same show-video-with-
 * image-fallback behavior as the Hero.
 */
export const driverCtaContentSchema = z.object({
  title: bilingualTextSchema,
  subtitle: bilingualTextSchema,
  buttonLabel: bilingualTextSchema,
  buttonHref: z.string().default("/become-a-driver"),
  backgroundImageUrl: z.string().url().optional(),
  backgroundVideoUrl: z.string().url().optional(),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type DriverCtaContent = z.infer<typeof driverCtaContentSchema>;

/** `siteContent/testimonials/items/{itemId}` */
export const testimonialItemSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  role: bilingualTextSchema,
  city: z.string(),
  /** Optional (Sprint 8.3) — shown alongside city when set. */
  country: z.string().optional(),
  /** Optional (Sprint 8.3) — falls back to the existing initials-avatar treatment when unset. */
  photoUrl: z.string().url().optional(),
  trips: z.number().int().min(0),
  quote: bilingualTextSchema,
  rating: z.number().int().min(1).max(5),
  order: z.number().int().min(0),
  /** The public site's `useTestimonials` hook filters out `active: false` items on read — publishing still copies the whole list, so a testimonial can be hidden and later re-shown without losing its content (Sprint 8.3). */
  active: z.boolean().default(true),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type TestimonialItem = z.infer<typeof testimonialItemSchema>;

export const createTestimonialItemInputSchema = testimonialItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  updatedBy: true,
  publishedAt: true,
  publishedBy: true,
});
export type CreateTestimonialItemInput = z.infer<typeof createTestimonialItemInputSchema>;

/** `siteContent/faq/items/{itemId}` — matches the shape already hardcoded in `apps/web/src/app/(marketing)/faq/page.tsx`. */
export const faqCategorySchema = z.enum(["general", "booking", "payments", "safety", "drivers"]);
export type FaqCategory = z.infer<typeof faqCategorySchema>;

export const faqItemSchema = z.object({
  id: z.string().min(1),
  category: faqCategorySchema,
  question: bilingualTextSchema,
  answer: bilingualTextSchema,
  order: z.number().int().min(0),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type FaqItem = z.infer<typeof faqItemSchema>;

export const createFaqItemInputSchema = faqItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  updatedBy: true,
  publishedAt: true,
  publishedBy: true,
});
export type CreateFaqItemInput = z.infer<typeof createFaqItemInputSchema>;

/**
 * `siteContent/footer`. Sprint 7.1 shipped tagline/newsletter/social only;
 * Sprint 7.2 adds the four nav-link columns (Company/Services/Support/
 * Legal) as CMS-editable arrays too.
 */
export const socialLinkSchema = z.object({
  /** `@the-ride/ui` icon registry key (see `packages/ui/src/tokens/icons.ts`) — kept as a plain string here since `@the-ride/types` doesn't depend on `@the-ride/ui`. */
  icon: z.string().min(1),
  label: bilingualTextSchema,
  href: z.string().min(1),
});

export type SocialLink = z.infer<typeof socialLinkSchema>;

export const footerLinkSchema = z.object({
  label: bilingualTextSchema,
  href: z.string().min(1),
});

export type FooterLink = z.infer<typeof footerLinkSchema>;

export const footerContentSchema = z.object({
  tagline: bilingualTextSchema,
  /** Optional (Sprint 8.3) — falls back to `@the-ride/ui`'s shared `<Logo>` component when unset. */
  logoImageUrl: z.string().url().optional(),
  logoText: z.string().optional(),
  copyrightText: bilingualTextSchema.optional(),
  newsletterTitle: bilingualTextSchema,
  newsletterBody: bilingualTextSchema,
  showNewsletter: z.boolean().default(true),
  socialLinks: z.array(socialLinkSchema),
  companyLinks: z.array(footerLinkSchema).default([]),
  serviceLinks: z.array(footerLinkSchema).default([]),
  supportLinks: z.array(footerLinkSchema).default([]),
  legalLinks: z.array(footerLinkSchema).default([]),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type FooterContent = z.infer<typeof footerContentSchema>;

/**
 * `siteContent/navigation` — the public site's main nav menu + logo
 * (Sprint 8.3). Feeds `apps/web/src/components/SiteHeader.tsx`. An empty
 * `items` array means "use today's 5 hardcoded nav links" — same
 * empty-list-means-fallback convention as every other list here.
 */
export const navigationItemSchema = z.object({
  id: z.string().min(1),
  label: bilingualTextSchema,
  href: z.string().min(1),
  visible: z.boolean().default(true),
  order: z.number().int().min(0),
});

export type NavigationItem = z.infer<typeof navigationItemSchema>;

export const navigationContentSchema = z.object({
  logoImageUrl: z.string().url().optional(),
  logoText: z.string().optional(),
  items: z.array(navigationItemSchema),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type NavigationContent = z.infer<typeof navigationContentSchema>;

/**
 * `siteContent/seo` — schema defined now per the CMS's data-model
 * requirement; no admin editor UI and no public-site consumption ship this
 * sprint (clean seam for a fast-follow).
 */
export const seoContentSchema = z.object({
  title: bilingualTextSchema,
  description: bilingualTextSchema,
  keywords: z.array(z.string()).default([]),
  ogImageUrl: z.string().url().optional(),
  twitterCardImageUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type SeoContent = z.infer<typeof seoContentSchema>;

/**
 * `siteContent/downloads` — schema defined now, no editor UI or public
 * consumption yet (same fast-follow seam as `seoContentSchema`).
 */
export const downloadsContentSchema = z.object({
  title: bilingualTextSchema,
  description: bilingualTextSchema,
  qrCodeUrl: z.string().url().optional(),
  appStoreUrl: z.string().url().optional(),
  playStoreUrl: z.string().url().optional(),
  phoneMockupImageUrl: z.string().url().optional(),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type DownloadsContent = z.infer<typeof downloadsContentSchema>;

/**
 * `siteContentMedia/{mediaId}` — the media library catalog. Admin-only
 * (never read by the public site, which only ever consumes a URL already
 * pasted into published content). Immutable once created: this sprint's
 * Media Library supports delete + re-upload, not "replace in place."
 */
export const siteMediaCategorySchema = z.enum([
  "hero",
  "sections",
  "testimonials",
  "downloads",
  "logos",
  "videos",
  "backgrounds",
  "vehicles",
]);
export type SiteMediaCategory = z.infer<typeof siteMediaCategorySchema>;

export const siteMediaItemSchema = z.object({
  id: z.string().min(1),
  category: siteMediaCategorySchema,
  url: z.string().url(),
  storagePath: z.string().min(1),
  contentKind: z.enum(["image", "video"]),
  fileName: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  durationSeconds: z.number().min(0).optional(),
  uploadedBy: z.string().min(1),
  createdAt: z.date(),
});

export type SiteMediaItem = z.infer<typeof siteMediaItemSchema>;

export const createSiteMediaItemInputSchema = siteMediaItemSchema.omit({ createdAt: true });
export type CreateSiteMediaItemInput = z.infer<typeof createSiteMediaItemInputSchema>;

/**
 * `siteContentHistory/{historyId}` — version history (Sprint 7.2).
 * Admin-only, never read by the public site. Written automatically by
 * `publish()`/`restore()` in `apps/admin/src/lib/site-content-*-admin.ts`:
 * every publish snapshots what it's about to overwrite, and every restore
 * copies a chosen snapshot back into the draft (never straight to
 * published — an admin still reviews and re-publishes). `snapshot` holds
 * either a full singleton document or a full list (for testimonials/faq),
 * whichever `area` denotes.
 */
export const siteContentHistoryActionSchema = z.enum(["publish", "restore"]);
export type SiteContentHistoryAction = z.infer<typeof siteContentHistoryActionSchema>;

export const siteContentHistorySchema = z.object({
  id: z.string().min(1),
  area: z.string().min(1),
  action: siteContentHistoryActionSchema,
  snapshot: z.unknown(),
  actorId: z.string().min(1),
  actorEmail: z.string().min(1),
  createdAt: z.date(),
});

export type SiteContentHistoryEntry = z.infer<typeof siteContentHistorySchema>;

export const createSiteContentHistoryInputSchema = siteContentHistorySchema.omit({
  id: true,
  createdAt: true,
});
export type CreateSiteContentHistoryInput = z.infer<typeof createSiteContentHistoryInputSchema>;
