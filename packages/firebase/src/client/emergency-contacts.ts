import type { EmergencyContact } from "@the-ride/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

const COLLECTION = "emergencyContacts";

/** Client-side emergency-contact CRUD (Sprint 6) — a top-level collection keyed by `userId`, full owner CRUD per `firestore.rules`. */

export function subscribeEmergencyContacts(
  db: Firestore,
  userId: string,
  onNext: (contacts: EmergencyContact[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as EmergencyContact)),
    (err) => onError(err.message),
  );
}

export interface EmergencyContactInput {
  name: string;
  phoneNumber: string;
  relationship?: string;
}

export async function addEmergencyContact(
  db: Firestore,
  userId: string,
  contact: EmergencyContactInput,
): Promise<void> {
  await addDoc(collection(db, COLLECTION), {
    ...contact,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateEmergencyContact(
  db: Firestore,
  contactId: string,
  contact: EmergencyContactInput,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, contactId), { ...contact, updatedAt: serverTimestamp() });
}

export async function deleteEmergencyContact(db: Firestore, contactId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, contactId));
}
