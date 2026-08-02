import { deleteSiteMedia, uploadSiteMedia } from "@the-ride/firebase/client";
import {
  createSiteMediaItemInputSchema,
  SITE_CONTENT_MEDIA_COLLECTION,
  type SiteMediaCategory,
  type SiteMediaItem,
} from "@the-ride/types";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

import { validateSiteMediaFile } from "./site-media-validation";

/**
 * Admin-dashboard Media Library (Sprint 7.1 Site Content CMS) — a simple
 * catalog this sprint: upload/list/delete/copy-URL. "Replace in place" and
 * search/filter are explicitly out of scope; items are immutable once
 * created (delete + re-upload instead).
 */

export function subscribeSiteMedia(
  db: Firestore,
  onNext: (items: SiteMediaItem[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, SITE_CONTENT_MEDIA_COLLECTION), orderBy("createdAt", "desc")),
    (snapshot) => onNext(snapshot.docs.map((d) => d.data() as SiteMediaItem)),
    (err) => onError(err.message),
  );
}

/** Validates, uploads to Storage, and catalogs the result in Firestore — throws with a user-facing message if validation fails. */
export async function uploadAndCatalogSiteMedia(
  db: Firestore,
  category: SiteMediaCategory,
  uploadedBy: string,
  file: File,
): Promise<SiteMediaItem> {
  const validation = await validateSiteMediaFile(file, category);
  if (!validation.ok) {
    throw new Error(validation.error ?? "This file can't be uploaded.");
  }

  const ref = doc(collection(db, SITE_CONTENT_MEDIA_COLLECTION));
  const mediaId = ref.id;
  const { url, storagePath } = await uploadSiteMedia(category, mediaId, file, file.name);

  const parsed = createSiteMediaItemInputSchema.parse({
    id: mediaId,
    category,
    url,
    storagePath,
    contentKind: file.type.startsWith("video/") ? "video" : "image",
    fileName: file.name,
    sizeBytes: file.size,
    durationSeconds: validation.durationSeconds,
    uploadedBy,
  });

  await setDoc(ref, { ...parsed, createdAt: serverTimestamp() });
  return { ...parsed, createdAt: new Date() };
}

export async function deleteSiteMediaItem(db: Firestore, item: SiteMediaItem): Promise<void> {
  await deleteSiteMedia(item.storagePath);
  await deleteDoc(doc(db, SITE_CONTENT_MEDIA_COLLECTION, item.id));
}
