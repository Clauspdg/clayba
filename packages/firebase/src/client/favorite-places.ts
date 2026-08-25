import type { FavoritePlace } from "@the-ride/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

/** Client-side saved-places access (Sprint 6) — the `passengers/{userId}/favoritePlaces` subcollection. */

export function subscribeFavoritePlaces(
  db: Firestore,
  userId: string,
  onNext: (places: FavoritePlace[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, "passengers", userId, "favoritePlaces"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as FavoritePlace)),
    (err) => onError(err.message),
  );
}

export interface NewFavoritePlace {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

/** Requires the passenger profile doc (`passengers/{userId}`) to already exist — see `getOrCreatePassengerProfile`. */
export async function addFavoritePlace(
  db: Firestore,
  userId: string,
  place: NewFavoritePlace,
): Promise<void> {
  await addDoc(collection(db, "passengers", userId, "favoritePlaces"), {
    ...place,
    passengerId: userId,
    createdAt: serverTimestamp(),
  });
}

export async function updateFavoritePlace(
  db: Firestore,
  userId: string,
  placeId: string,
  place: NewFavoritePlace,
): Promise<void> {
  await updateDoc(doc(db, "passengers", userId, "favoritePlaces", placeId), { ...place });
}

export async function deleteFavoritePlace(
  db: Firestore,
  userId: string,
  placeId: string,
): Promise<void> {
  await deleteDoc(doc(db, "passengers", userId, "favoritePlaces", placeId));
}
