import {
  DOWNLOADS_CONTENT_DOC_ID,
  DRIVER_CTA_CONTENT_DOC_ID,
  FOOTER_CONTENT_DOC_ID,
  HOMEPAGE_CONTENT_DOC_ID,
  HOW_IT_WORKS_CONTENT_DOC_ID,
  SAFETY_CONTENT_DOC_ID,
  SECTIONS_CONTENT_DOC_ID,
  SEO_CONTENT_DOC_ID,
  SITE_CONTENT_COLLECTION,
  SITE_CONTENT_DRAFTS_COLLECTION,
} from "@the-ride/types";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

import { recordHistory } from "./site-content-history-admin";

/**
 * Admin-dashboard Site Content CMS (Sprint 7.1) — singleton content areas
 * (Homepage/Hero, Sections config, Footer, SEO, Downloads). Mirrors the
 * `settings-admin.ts` singleton-document pattern: direct client Firestore
 * reads/writes, authorized by `firestore.rules`'s new `isAdmin()`-gated
 * `siteContent`/`siteContentDrafts` blocks.
 *
 * Admins only ever write to `siteContentDrafts/*`. The one write path into
 * `siteContent/*` (the public-read tree) is `publishSingletonArea` below —
 * a plain draft edit never touches it.
 */

export type SingletonArea =
  "homepage" | "sections" | "footer" | "seo" | "downloads" | "howItWorks" | "safety" | "driverCta";

const DOC_ID_BY_AREA: Record<SingletonArea, string> = {
  homepage: HOMEPAGE_CONTENT_DOC_ID,
  sections: SECTIONS_CONTENT_DOC_ID,
  footer: FOOTER_CONTENT_DOC_ID,
  seo: SEO_CONTENT_DOC_ID,
  downloads: DOWNLOADS_CONTENT_DOC_ID,
  howItWorks: HOW_IT_WORKS_CONTENT_DOC_ID,
  safety: SAFETY_CONTENT_DOC_ID,
  driverCta: DRIVER_CTA_CONTENT_DOC_ID,
};

/** Version/bookkeeping fields every content doc carries — stripped before copying content between the draft and published trees so each side's own history stays independent. */
const META_FIELDS = ["createdAt", "updatedAt", "updatedBy", "publishedAt", "publishedBy"] as const;

function stripMeta(data: DocumentData): DocumentData {
  const content = { ...data };
  for (const field of META_FIELDS) delete content[field];
  return content;
}

function draftRef(db: Firestore, area: SingletonArea) {
  return doc(db, SITE_CONTENT_DRAFTS_COLLECTION, DOC_ID_BY_AREA[area]);
}

function publishedRef(db: Firestore, area: SingletonArea) {
  return doc(db, SITE_CONTENT_COLLECTION, DOC_ID_BY_AREA[area]);
}

export function subscribeSingletonDraft<T extends DocumentData>(
  db: Firestore,
  area: SingletonArea,
  onNext: (data: T | null) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    draftRef(db, area),
    (snapshot) => onNext(snapshot.exists() ? (snapshot.data() as T) : null),
    (err) => onError(err.message),
  );
}

export function subscribeSingletonPublished<T extends DocumentData>(
  db: Firestore,
  area: SingletonArea,
  onNext: (data: T | null) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    publishedRef(db, area),
    (snapshot) => onNext(snapshot.exists() ? (snapshot.data() as T) : null),
    (err) => onError(err.message),
  );
}

export async function saveSingletonDraft(
  db: Firestore,
  area: SingletonArea,
  updatedBy: string,
  content: object,
): Promise<void> {
  const ref = draftRef(db, area);
  const existing = await getDoc(ref);
  await setDoc(
    ref,
    {
      ...content,
      updatedBy,
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
}

/**
 * Copies `siteContentDrafts/{area}` → `siteContent/{area}`, stamping publish
 * metadata. This is the only write path into the public-read tree. Before
 * overwriting, snapshots whatever was previously published into
 * `siteContentHistory` (Sprint 7.2) — skipped on an area's first-ever
 * publish, since there's nothing meaningful to restore back to yet.
 */
export async function publishSingletonArea(
  db: Firestore,
  area: SingletonArea,
  publishedBy: string,
  publishedByEmail: string,
): Promise<void> {
  const draftSnap = await getDoc(draftRef(db, area));
  if (!draftSnap.exists()) {
    throw new Error("Nothing to publish yet — save a draft first.");
  }
  const publishedSnap = await getDoc(publishedRef(db, area));
  if (publishedSnap.exists()) {
    await recordHistory(
      db,
      area,
      "publish",
      stripMeta(publishedSnap.data()),
      publishedBy,
      publishedByEmail,
    );
  }
  await setDoc(publishedRef(db, area), {
    ...stripMeta(draftSnap.data()),
    createdAt: publishedSnap.exists() ? publishedSnap.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
    publishedAt: serverTimestamp(),
    publishedBy,
  });
}

/** Copies a past `siteContentHistory` snapshot back into the draft (never straight to published) so an admin can review before re-publishing. */
export async function restoreSingletonFromHistory(
  db: Firestore,
  area: SingletonArea,
  snapshot: Record<string, unknown>,
  updatedBy: string,
): Promise<void> {
  const draftSnap = await getDoc(draftRef(db, area));
  await setDoc(draftRef(db, area), {
    ...stripMeta(snapshot),
    createdAt: draftSnap.exists() ? draftSnap.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy,
  });
}

/** Discards unpublished draft changes by copying the currently-published content back over the draft. */
export async function discardSingletonDraft(
  db: Firestore,
  area: SingletonArea,
  updatedBy: string,
): Promise<void> {
  const publishedSnap = await getDoc(publishedRef(db, area));
  if (!publishedSnap.exists()) {
    throw new Error("Nothing published yet to revert to.");
  }
  const draftSnap = await getDoc(draftRef(db, area));
  await setDoc(draftRef(db, area), {
    ...stripMeta(publishedSnap.data()),
    createdAt: draftSnap.exists() ? draftSnap.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy,
  });
}
