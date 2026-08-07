import type { Notification } from "@the-ride/types";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

const COLLECTION = "notifications";

/** Client-side notification access (Sprint 6) — read/mark-read/delete only; creation is server-side (`firestore.rules`: `allow create: if isAdmin()`). */

export function subscribeMyNotifications(
  db: Firestore,
  userId: string,
  onNext: (notifications: Notification[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Notification)),
    (err) => onError(err.message),
  );
}

export async function markNotificationRead(db: Firestore, notificationId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, notificationId), { isRead: true });
}

export async function deleteNotification(db: Firestore, notificationId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, notificationId));
}
