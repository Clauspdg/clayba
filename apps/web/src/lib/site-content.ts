import {
  FAQ_SUBCOLLECTION,
  FOOTER_CONTENT_DOC_ID,
  HOMEPAGE_CONTENT_DOC_ID,
  SECTIONS_CONTENT_DOC_ID,
  SITE_CONTENT_COLLECTION,
  TESTIMONIALS_SUBCOLLECTION,
  type FaqItem,
  type FooterContent,
  type HomepageContent,
  type SectionsContent,
  type TestimonialItem,
} from "@the-ride/types";
import { collection, doc, onSnapshot, orderBy, query, type Unsubscribe } from "firebase/firestore";

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
