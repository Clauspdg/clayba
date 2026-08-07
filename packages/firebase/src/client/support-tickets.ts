import {
  SupportTicketStatus,
  createSupportTicketInputSchema,
  type SupportTicket,
  type SupportTicketPriority,
} from "@the-ride/types";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

const COLLECTION = "supportTickets";

/** Client-side support ticket access (Sprint 6) — a passenger may create and read their own tickets; status changes are support-staff-only per `firestore.rules`. */

export function subscribeMyTickets(
  db: Firestore,
  requesterId: string,
  onNext: (tickets: SupportTicket[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, COLLECTION),
    where("requesterId", "==", requesterId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as SupportTicket)),
    (err) => onError(err.message),
  );
}

export async function createSupportTicket(
  db: Firestore,
  input: {
    requesterId: string;
    subject: string;
    description: string;
    priority: SupportTicketPriority;
  },
): Promise<void> {
  const parsed = createSupportTicketInputSchema.parse({
    ...input,
    status: SupportTicketStatus.OPEN,
  });
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, { ...parsed, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
