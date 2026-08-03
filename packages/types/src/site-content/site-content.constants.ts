import type { SectionConfig } from "./site-content.schemas";

export const SITE_CONTENT_COLLECTION = "siteContent";
export const SITE_CONTENT_DRAFTS_COLLECTION = "siteContentDrafts";
export const SITE_CONTENT_MEDIA_COLLECTION = "siteContentMedia";
export const SITE_CONTENT_HISTORY_COLLECTION = "siteContentHistory";

export const HOMEPAGE_CONTENT_DOC_ID = "homepage";
export const SECTIONS_CONTENT_DOC_ID = "sections";
export const FOOTER_CONTENT_DOC_ID = "footer";
export const SEO_CONTENT_DOC_ID = "seo";
export const DOWNLOADS_CONTENT_DOC_ID = "downloads";
export const HOW_IT_WORKS_CONTENT_DOC_ID = "howItWorks";
export const SAFETY_CONTENT_DOC_ID = "safety";
export const DRIVER_CTA_CONTENT_DOC_ID = "driverCta";
export const STATISTICS_CONTENT_DOC_ID = "statistics";
export const TRACKING_CONTENT_DOC_ID = "tracking";
export const NAVIGATION_CONTENT_DOC_ID = "navigation";

export const TESTIMONIALS_SUBCOLLECTION = "testimonials/items";
export const FAQ_SUBCOLLECTION = "faq/items";

/**
 * The order the eight toggleable sections render in today, before any admin
 * has published a `siteContent/sections` doc — matches
 * `apps/web/src/app/page.tsx`'s current fixed JSX sequence exactly, so
 * publishing a CMS override is the first thing that can ever change it.
 */
export const DEFAULT_SECTIONS_ORDER: Omit<SectionConfig, "order">["key"][] = [
  "stats",
  "vehicleTypes",
  "mapPreview",
  "howItWorks",
  "safety",
  "testimonials",
  "mobileApp",
  "driverCta",
];

export const DEFAULT_SECTIONS_CONFIG: SectionConfig[] = DEFAULT_SECTIONS_ORDER.map(
  (key, index) => ({
    key,
    enabled: true,
    order: index,
  }),
);
