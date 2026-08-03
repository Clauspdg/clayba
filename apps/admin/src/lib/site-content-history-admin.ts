import {
  createSiteContentHistoryInputSchema,
  SITE_CONTENT_HISTORY_COLLECTION,
  type SiteContentHistoryAction,
  type SiteContentHistoryEntry,
} from "@the-ride/types";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

/**
 * Version history (Sprint 7.2 Site Content CMS) — one shared module used by
 * every publishable content area instead of bespoke history code per area.
 * `recordHistory` is called from inside the existing `publishSingletonArea`
 * / `publishTestimonials` / `publishFaq` functions, right before they
 * overwrite the published tree, so every publish leaves a snapshot of what
 * it replaced. Restoring copies that snapshot back into the *draft*, never
 * straight to published — an admin still reviews and re-publishes.
 */

export async function recordHistory(
  db: Firestore,
  area: string,
  action: SiteContentHistoryAction,
  snapshot: unknown,
  actorId: string,
  actorEmail: string,
): Promise<void> {
  const input = createSiteContentHistoryInputSchema.parse({
    area,
    action,
    snapshot,
    actorId,
    actorEmail,
  });
  const ref = doc(collection(db, SITE_CONTENT_HISTORY_COLLECTION));
  await setDoc(ref, { ...input, id: ref.id, createdAt: serverTimestamp() });
}

export function subscribeHistory(
  db: Firestore,
  area: string,
  onNext: (entries: SiteContentHistoryEntry[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, SITE_CONTENT_HISTORY_COLLECTION),
      where("area", "==", area),
      orderBy("createdAt", "desc"),
      limit(20),
    ),
    (snapshot) => onNext(snapshot.docs.map((d) => d.data() as SiteContentHistoryEntry)),
    (err) => onError(err.message),
  );
}
