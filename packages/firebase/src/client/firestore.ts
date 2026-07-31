import { getFirestore, type Firestore } from "firebase/firestore";

import { getClientApp } from "./app";

let cachedFirestore: Firestore | undefined;

/**
 * Client-side Firestore access (Sprint 5, Part 3) — for reads/listeners a
 * signed-in user makes directly from the browser/app, authorized by
 * `firestore.rules` rather than by going through a server. Admin-SDK
 * writes/reads that must bypass rules (dispatch, moderation, seeding) stay
 * on `@the-ride/firebase/firestore`'s repositories — this is the
 * complementary client-side half, not a replacement for them.
 */
export function getClientFirestore(): Firestore {
  if (!cachedFirestore) {
    cachedFirestore = getFirestore(getClientApp());
  }
  return cachedFirestore;
}
