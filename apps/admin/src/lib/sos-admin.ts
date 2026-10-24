import { SOS_INCIDENTS_COLLECTION, SosIncidentStatus } from "@the-ride/types";
import { doc, updateDoc, type Firestore } from "firebase/firestore";

/**
 * Admin/dispatch acknowledge + resolve actions for `sosIncidents` — real
 * writes via the client Firestore SDK, authorized by `firestore.rules`'s
 * `hasRole(['admin','super_admin','dispatcher'])` check on that
 * collection's `update` rule (creation itself stays server-only, via the
 * `triggerSosAlert` callable).
 *
 * Uses a plain client `Date`, not `serverTimestamp()` — same reasoning as
 * `driver-admin.ts`: `SosIncidentsTab` realtime-subscribes to this
 * collection and schema-parses every doc with `firestoreDateSchema`, and a
 * server-timestamp sentinel resolves to `null` in the local-echo snapshot
 * that listener receives before the server acks, which would fail
 * `sosIncidentSchema.parse()` on that transient snapshot.
 */
export async function acknowledgeIncident(
  db: Firestore,
  incidentId: string,
  acknowledgedBy: string,
): Promise<void> {
  await updateDoc(doc(db, SOS_INCIDENTS_COLLECTION, incidentId), {
    status: SosIncidentStatus.ACKNOWLEDGED,
    acknowledgedBy,
    acknowledgedAt: new Date(),
  });
}

export async function resolveIncident(
  db: Firestore,
  incidentId: string,
  resolvedBy: string,
): Promise<void> {
  await updateDoc(doc(db, SOS_INCIDENTS_COLLECTION, incidentId), {
    status: SosIncidentStatus.RESOLVED,
    resolvedBy,
    resolvedAt: new Date(),
  });
}
