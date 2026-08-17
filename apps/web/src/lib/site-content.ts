import {
  DRIVER_CTA_CONTENT_DOC_ID,
  FAQ_SUBCOLLECTION,
  FOOTER_CONTENT_DOC_ID,
  HOMEPAGE_CONTENT_DOC_ID,
  HOW_IT_WORKS_CONTENT_DOC_ID,
  NAVIGATION_CONTENT_DOC_ID,
  SAFETY_CONTENT_DOC_ID,
  SECTIONS_CONTENT_DOC_ID,
  SITE_CONTENT_COLLECTION,
  STATISTICS_CONTENT_DOC_ID,
  TESTIMONIALS_SUBCOLLECTION,
  TRACKING_CONTENT_DOC_ID,
  type DriverCtaContent,
  type FaqItem,
  type FooterContent,
  type HomepageContent,
  type HowItWorksContent,
  type NavigationContent,
  type SafetyContent,
  type SectionsContent,
  type StatisticsContent,
  type TestimonialItem,
  type TrackingContent,
  type VehicleCategory,
} from "@the-ride/types";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { webFirestore } from "./firebase-client";

/**
 * Public-site read layer for the Site Content CMS (Sprint 7.1). Touches
 * ONLY the published `siteContent/*` tree — never `siteContentDrafts`,
 * which isn't public-readable anyway (see `firestore.rules`). `apps/web`
 * is a static export with no server runtime, so this content is fetched
 * client-side after mount; see `useSiteContent.ts` for the fallback-to-
 * static-i18n behavior while (or if) no CMS data has ever been published.
 */

export function subscribeHomepageContent(
  onNext: (data: HomepageContent | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(webFirestore, SITE_CONTENT_COLLECTION, HOMEPAGE_CONTENT_DOC_ID),
    (snapshot) => onNext(snapshot.exists() ? (snapshot.data() as HomepageContent) : null),
    () => onNext(null),
  );
}

export function subscribeSectionsContent(
  onNext: (data: SectionsContent | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(webFirestore, SITE_CONTENT_COLLECTION, SECTIONS_CONTENT_DOC_ID),
    (snapshot) => onNext(snapshot.exists() ? (snapshot.data() as SectionsContent) : null),
    () => onNext(null),
  );
}

export function subscribeFooterContent(onNext: (data: FooterContent | null) => void): Unsubscribe {
  return onSnapshot(
    doc(webFirestore, SITE_CONTENT_COLLECTION, FOOTER_CONTENT_DOC_ID),
    (snapshot) => onNext(snapshot.exists() ? (snapshot.data() as FooterContent) : null),
    () => onNext(null),
  );
}

export function subscribeTestimonials(onNext: (items: TestimonialItem[]) => void): Unsubscribe {
  return onSnapshot(
    query(
      collection(webFirestore, `${SITE_CONTENT_COLLECTION}/${TESTIMONIALS_SUBCOLLECTION}`),
      orderBy("order", "asc"),
    ),
    (snapshot) => onNext(snapshot.docs.map((d) => d.data() as TestimonialItem)),
    () => onNext([]),
  );
}

export function subscribeFaqItems(onNext: (items: FaqItem[]) => void): Unsubscribe {
  return onSnapshot(
    query(
      collection(webFirestore, `${SITE_CONTENT_COLLECTION}/${FAQ_SUBCOLLECTION}`),
      orderBy("order", "asc"),
    ),
    (snapshot) => onNext(snapshot.docs.map((d) => d.data() as FaqItem)),
    () => onNext([]),
  );
}

export function subscribeHowItWorksContent(
  onNext: (data: HowItWorksContent | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(webFirestore, SITE_CONTENT_COLLECTION, HOW_IT_WORKS_CONTENT_DOC_ID),
    (snapshot) => onNext(snapshot.exists() ? (snapshot.data() as HowItWorksContent) : null),
    () => onNext(null),
  );
}

export function subscribeSafetyContent(onNext: (data: SafetyContent | null) => void): Unsubscribe {
  return onSnapshot(
    doc(webFirestore, SITE_CONTENT_COLLECTION, SAFETY_CONTENT_DOC_ID),
    (snapshot) => onNext(snapshot.exists() ? (snapshot.data() as SafetyContent) : null),
    () => onNext(null),
  );
}

export function subscribeDriverCtaContent(
  onNext: (data: DriverCtaContent | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(webFirestore, SITE_CONTENT_COLLECTION, DRIVER_CTA_CONTENT_DOC_ID),
    (snapshot) => onNext(snapshot.exists() ? (snapshot.data() as DriverCtaContent) : null),
    () => onNext(null),
  );
}

export function subscribeStatisticsContent(
  onNext: (data: StatisticsContent | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(webFirestore, SITE_CONTENT_COLLECTION, STATISTICS_CONTENT_DOC_ID),
    (snapshot) => onNext(snapshot.exists() ? (snapshot.data() as StatisticsContent) : null),
    () => onNext(null),
  );
}

export function subscribeTrackingContent(
  onNext: (data: TrackingContent | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(webFirestore, SITE_CONTENT_COLLECTION, TRACKING_CONTENT_DOC_ID),
    (snapshot) => onNext(snapshot.exists() ? (snapshot.data() as TrackingContent) : null),
    () => onNext(null),
  );
}

export function subscribeNavigationContent(
  onNext: (data: NavigationContent | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(webFirestore, SITE_CONTENT_COLLECTION, NAVIGATION_CONTENT_DOC_ID),
    (snapshot) => onNext(snapshot.exists() ? (snapshot.data() as NavigationContent) : null),
    () => onNext(null),
  );
}

/**
 * Ride Categories (Sprint 7.2) — the real `vehicleCategories` collection,
 * already public-read and already the fare-calculation source of truth
 * (see `packages/types/src/settings/settings.schemas.ts`). The marketing
 * site reads it directly rather than a second, CMS-only copy, so displayed
 * pricing never drifts from what booking actually charges.
 */
/**
 * BOOKING-04 — `onError` is optional (existing callers that don't need to
 * distinguish "genuinely zero active categories" from "the query failed"
 * can omit it, matching every other subscribe* in this file); when passed,
 * a real Firestore error is reported instead of being silently collapsed
 * into an empty result.
 */
export function subscribeVehicleCategories(
  onNext: (items: VehicleCategory[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(webFirestore, "vehicleCategories"),
      where("isActive", "==", true),
      orderBy("sortOrder", "asc"),
    ),
    (snapshot) => onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as VehicleCategory)),
    (err) => {
      onNext([]);
      onError?.(err.message);
    },
  );
}
