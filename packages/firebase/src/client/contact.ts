import type { CreateContactSubmissionInput } from "@the-ride/types";
import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";

const COLLECTION = "contactSubmissions";

/** The public "Contact us" form's only Firestore write (Web Phase W1, Part 1) — open to anonymous visitors, see firestore.rules. */
export async function submitContactForm(
  db: Firestore,
  input: CreateContactSubmissionInput,
): Promise<void> {
  await addDoc(collection(db, COLLECTION), {
    ...input,
    status: "new",
    createdAt: serverTimestamp(),
  });
}
