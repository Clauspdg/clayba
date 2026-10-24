import { SOS_INCIDENTS_COLLECTION, sosIncidentSchema, type SosIncident } from "@the-ride/types";
import {
  collection,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { httpsCallable, type Functions } from "firebase/functions";

/**
 * "Send SOS Alert" — the real backend behind every app's Safety panel,
 * routed through the trusted `triggerSosAlert` callable (never a direct
 * client write: `firestore.rules` denies `create` on `sosIncidents`
 * entirely). `location` is best-effort and optional — callers must never
 * block sending the alert on getting a location fix.
 */
export async function triggerSosAlert(
  functions: Functions,
  tripId: string,
  location?: { lat: number; lng: number; accuracy?: number },
): Promise<{ incidentId: string }> {
  const call = httpsCallable<
    { tripId: string; location?: typeof location },
    { incidentId: string }
  >(functions, "triggerSosAlert");
  const result = await call({ tripId, location });
  return result.data;
}

/** Live SOS incident feed for admin/dispatch — staff-only per `firestore.rules`. */
export function subscribeSosIncidents(
  db: Firestore,
  onNext: (incidents: SosIncident[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, SOS_INCIDENTS_COLLECTION),
    orderBy("createdAt", "desc"),
    fsLimit(200),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const parsed: SosIncident[] = [];
      for (const d of snapshot.docs) {
        try {
          parsed.push(sosIncidentSchema.parse({ id: d.id, ...d.data() }));
        } catch (err) {
          console.error("[subscribeSosIncidents] failed to parse", d.id, err);
        }
      }
      onNext(parsed);
    },
    (err) => onError(err.message),
  );
}
