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
 * `backgroundType: "gradient"` (the default) means "use the existing
 * hand-crafted animated treatment," matching what `Hero.tsx` renders today
 * with zero CMS data — an admin has to deliberately opt into an
 * image/video background to replace it.
 */
export const homepageContentSchema = z.object({
  eyebrow: bilingualTextSchema,
  title: bilingualTextSchema,
  subtitle: bilingualTextSchema,
  ctaPassengerLabel: bilingualTextSchema,
  ctaDriverLabel: bilingualTextSchema,
  backgroundType: z.enum(["gradient", "image", "video"]).default("gradient"),
  backgroundImageUrl: z.string().url().optional(),
  backgroundVideoUrl: z.string().url().optional(),
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

/** `siteContent/testimonials/items/{itemId}` */
export const testimonialItemSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  role: bilingualTextSchema,
  city: z.string(),
  trips: z.number().int().min(0),
  quote: bilingualTextSchema,
  rating: z.number().int().min(1).max(5),
  order: z.number().int().min(0),
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
 * `siteContent/footer` — deliberately narrow: only tagline, newsletter
 * copy/toggle, and social links are CMS-editable. The four nav-link columns
 * (Company/Services/Support/Legal) stay hardcoded — they're site
 * navigation, not marketing copy.
 */
export const socialLinkSchema = z.object({
  /** `@the-ride/ui` icon registry key (see `packages/ui/src/tokens/icons.ts`) — kept as a plain string here since `@the-ride/types` doesn't depend on `@the-ride/ui`. */
  icon: z.string().min(1),
  label: bilingualTextSchema,
  href: z.string().min(1),
});

export type SocialLink = z.infer<typeof socialLinkSchema>;

export const footerContentSchema = z.object({
  tagline: bilingualTextSchema,
  newsletterTitle: bilingualTextSchema,
  newsletterBody: bilingualTextSchema,
  showNewsletter: z.boolean().default(true),
  socialLinks: z.array(socialLinkSchema),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  createdAt: z.date(),
  publishedAt: z.date().optional(),
  publishedBy: z.string().min(1).optional(),
});

export type FooterContent = z.infer<typeof footerContentSchema>;

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
