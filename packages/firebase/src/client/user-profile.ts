import { doc, serverTimestamp, updateDoc, type Firestore } from "firebase/firestore";

/** Updates the `users/{uid}` document's `phoneNumber` field (Sprint 6, Profile: "Phone number") — owner-writable per `firestore.rules`. */
export async function updateUserPhoneNumber(
  db: Firestore,
  uid: string,
  phoneNumber: string,
): Promise<void> {
  await updateDoc(doc(db, "users", uid), { phoneNumber, updatedAt: serverTimestamp() });
}
