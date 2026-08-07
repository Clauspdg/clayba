import {
  CONTACT_SUBMISSIONS_COLLECTION,
  SUPPORT_TICKETS_COLLECTION,
  SupportTicketStatus,
} from "@the-ride/types";
import { doc, serverTimestamp, updateDoc, type Firestore } from "firebase/firestore";

/**
 * Admin-dashboard support actions (Web Phase W1, Parts 5-6) — direct
 * client Firestore writes, authorized by `firestore.rules`'s
 * `hasRole(['admin','super_admin','support'])` check on `supportTickets`'s
 * update rule, and `isAdmin()` on `contactSubmissions`'s update rule.
 */

export async function assignTicketToMe(
  db: Firestore,
  ticketId: string,
  uid: string,
): Promise<void> {
  await updateDoc(doc(db, SUPPORT_TICKETS_COLLECTION, ticketId), {
    assignedTo: uid,
    status: SupportTicketStatus.ASSIGNED,
    updatedAt: serverTimestamp(),
  });
}

export async function resolveTicket(db: Firestore, ticketId: string): Promise<void> {
  await updateDoc(doc(db, SUPPORT_TICKETS_COLLECTION, ticketId), {
    status: SupportTicketStatus.RESOLVED,
    updatedAt: serverTimestamp(),
  });
}

export async function markContactSubmissionRead(db: Firestore, id: string): Promise<void> {
  await updateDoc(doc(db, CONTACT_SUBMISSIONS_COLLECTION, id), { status: "read" });
}
