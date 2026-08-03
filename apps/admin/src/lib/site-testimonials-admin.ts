import {
  createTestimonialItemInputSchema,
  SITE_CONTENT_COLLECTION,
  SITE_CONTENT_DRAFTS_COLLECTION,
  TESTIMONIALS_SUBCOLLECTION,
  type CreateTestimonialItemInput,
  type TestimonialItem,
} from "@the-ride/types";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

import { recordHistory } from "./site-content-history-admin";

/**
 * Admin-dashboard Testimonials CRUD (Sprint 7.1 Site Content CMS). Same
 * draft/published split as `site-content-admin.ts`'s singleton areas, but
 * for a list: admins CRUD `siteContentDrafts/testimonials/items`, and
 * `publishTestimonials` is the only path that ever writes
 * `siteContent/testimonials/items` (public-read).
 */

const HISTORY_AREA = "testimonials";

const META_FIELDS = ["createdAt", "updatedAt", "updatedBy", "publishedAt", "publishedBy"] as const;

function stripMeta(data: DocumentData): DocumentData {
  const content = { ...data };
  for (const field of META_FIELDS) delete content[field];
  return content;
}

function draftCollection(db: Firestore) {
  return collection(db, `${SITE_CONTENT_DRAFTS_COLLECTION}/${TESTIMONIALS_SUBCOLLECTION}`);
}

function publishedCollection(db: Firestore) {
  return collection(db, `${SITE_CONTENT_COLLECTION}/${TESTIMONIALS_SUBCOLLECTION}`);
}

export function subscribeTestimonialsDraft(
  db: Firestore,
  onNext: (items: TestimonialItem[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    query(draftCollection(db), orderBy("order", "asc")),
    (snapshot) => onNext(snapshot.docs.map((d) => d.data() as TestimonialItem)),
    (err) => onError(err.message),
  );
}

export function subscribeTestimonialsPublished(
  db: Firestore,
  onNext: (items: TestimonialItem[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    query(publishedCollection(db), orderBy("order", "asc")),
    (snapshot) => onNext(snapshot.docs.map((d) => d.data() as TestimonialItem)),
    (err) => onError(err.message),
  );
}

export async function createTestimonialDraft(
  db: Firestore,
  updatedBy: string,
  input: CreateTestimonialItemInput,
): Promise<void> {
  const parsed = createTestimonialItemInputSchema.parse(input);
  const ref = doc(draftCollection(db));
  await setDoc(ref, {
    ...parsed,
    id: ref.id,
    updatedBy,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

export async function updateTestimonialDraft(
  db: Firestore,
  id: string,
  updatedBy: string,
  input: CreateTestimonialItemInput,
): Promise<void> {
  const parsed = createTestimonialItemInputSchema.parse(input);
  await updateDoc(doc(draftCollection(db), id), {
    ...parsed,
    updatedBy,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTestimonialDraft(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(draftCollection(db), id));
}

/** Persists a new top-to-bottom order after a drag-reorder in the admin list. */
export async function reorderTestimonialsDraft(db: Firestore, orderedIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) =>
    batch.update(doc(draftCollection(db), id), { order: index, updatedAt: serverTimestamp() }),
  );
  await batch.commit();
}

export function toCreateTestimonialInput(item: TestimonialItem): CreateTestimonialItemInput {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    updatedBy: _updatedBy,
    publishedAt: _publishedAt,
    publishedBy: _publishedBy,
    ...rest
  } = item;
  return rest;
}

/**
 * Replaces the entire published list with the current draft list —
 * testimonials are swapped whole-list, not merged item-by-item (there's no
 * natural "field" to merge a list on). Snapshots the previous published
 * list into `siteContentHistory` first (Sprint 7.2), skipped when nothing
 * was published yet.
 */
export async function publishTestimonials(
  db: Firestore,
  publishedBy: string,
  publishedByEmail: string,
): Promise<void> {
  const [draftSnap, publishedSnap] = await Promise.all([
    getDocs(query(draftCollection(db), orderBy("order", "asc"))),
    getDocs(query(publishedCollection(db), orderBy("order", "asc"))),
  ]);
  if (!publishedSnap.empty) {
    await recordHistory(
      db,
      HISTORY_AREA,
      "publish",
      publishedSnap.docs.map((d) => stripMeta(d.data())),
      publishedBy,
      publishedByEmail,
    );
  }
  const draftIds = new Set(draftSnap.docs.map((d) => d.id));
  const batch = writeBatch(db);
  publishedSnap.docs.forEach((d) => {
    if (!draftIds.has(d.id)) batch.delete(d.ref);
  });
  draftSnap.docs.forEach((d) => {
    batch.set(doc(publishedCollection(db), d.id), {
      ...stripMeta(d.data()),
      publishedAt: serverTimestamp(),
      publishedBy,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

/** Restores a past `siteContentHistory` snapshot (a full item list) back into the draft, replacing whatever's there — never straight to published. */
export async function restoreTestimonialsFromHistory(
  db: Firestore,
  snapshot: Record<string, unknown>[],
  updatedBy: string,
): Promise<void> {
  const draftSnap = await getDocs(draftCollection(db));
  const batch = writeBatch(db);
  draftSnap.docs.forEach((d) => batch.delete(d.ref));
  snapshot.forEach((item) => {
    const id = String(item.id);
    batch.set(doc(draftCollection(db), id), { ...item, updatedBy, updatedAt: serverTimestamp() });
  });
  await batch.commit();
}

/** Discards unpublished draft changes by copying the published list back over the draft. */
export async function discardTestimonialsDraft(db: Firestore, updatedBy: string): Promise<void> {
  const [draftSnap, publishedSnap] = await Promise.all([
    getDocs(draftCollection(db)),
    getDocs(publishedCollection(db)),
  ]);
  const publishedIds = new Set(publishedSnap.docs.map((d) => d.id));
  const batch = writeBatch(db);
  draftSnap.docs.forEach((d) => {
    if (!publishedIds.has(d.id)) batch.delete(d.ref);
  });
  publishedSnap.docs.forEach((d) => {
    batch.set(doc(draftCollection(db), d.id), {
      ...stripMeta(d.data()),
      updatedBy,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}
