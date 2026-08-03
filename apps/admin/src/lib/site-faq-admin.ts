import {
  createFaqItemInputSchema,
  FAQ_SUBCOLLECTION,
  SITE_CONTENT_COLLECTION,
  SITE_CONTENT_DRAFTS_COLLECTION,
  type CreateFaqItemInput,
  type FaqItem,
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
 * Admin-dashboard FAQ CRUD (Sprint 7.1 Site Content CMS). Identical
 * draft/published split and whole-list publish semantics as
 * `site-testimonials-admin.ts` — see that file's comment for the rationale.
 */

const HISTORY_AREA = "faq";

const META_FIELDS = ["createdAt", "updatedAt", "updatedBy", "publishedAt", "publishedBy"] as const;

function stripMeta(data: DocumentData): DocumentData {
  const content = { ...data };
  for (const field of META_FIELDS) delete content[field];
  return content;
}

function draftCollection(db: Firestore) {
  return collection(db, `${SITE_CONTENT_DRAFTS_COLLECTION}/${FAQ_SUBCOLLECTION}`);
}

function publishedCollection(db: Firestore) {
  return collection(db, `${SITE_CONTENT_COLLECTION}/${FAQ_SUBCOLLECTION}`);
}

export function subscribeFaqDraft(
  db: Firestore,
  onNext: (items: FaqItem[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    query(draftCollection(db), orderBy("order", "asc")),
    (snapshot) => onNext(snapshot.docs.map((d) => d.data() as FaqItem)),
    (err) => onError(err.message),
  );
}

export function subscribeFaqPublished(
  db: Firestore,
  onNext: (items: FaqItem[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    query(publishedCollection(db), orderBy("order", "asc")),
    (snapshot) => onNext(snapshot.docs.map((d) => d.data() as FaqItem)),
    (err) => onError(err.message),
  );
}

export async function createFaqDraft(
  db: Firestore,
  updatedBy: string,
  input: CreateFaqItemInput,
): Promise<void> {
  const parsed = createFaqItemInputSchema.parse(input);
  const ref = doc(draftCollection(db));
  await setDoc(ref, {
    ...parsed,
    id: ref.id,
    updatedBy,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

export async function updateFaqDraft(
  db: Firestore,
  id: string,
  updatedBy: string,
  input: CreateFaqItemInput,
): Promise<void> {
  const parsed = createFaqItemInputSchema.parse(input);
  await updateDoc(doc(draftCollection(db), id), {
    ...parsed,
    updatedBy,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFaqDraft(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(draftCollection(db), id));
}

export async function reorderFaqDraft(db: Firestore, orderedIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) =>
    batch.update(doc(draftCollection(db), id), { order: index, updatedAt: serverTimestamp() }),
  );
  await batch.commit();
}

export function toCreateFaqInput(item: FaqItem): CreateFaqItemInput {
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

/** Snapshots the previous published list into `siteContentHistory` first (Sprint 7.2), skipped when nothing was published yet — see `publishTestimonials`'s comment for the rationale. */
export async function publishFaq(
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
export async function restoreFaqFromHistory(
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

export async function discardFaqDraft(db: Firestore, updatedBy: string): Promise<void> {
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
