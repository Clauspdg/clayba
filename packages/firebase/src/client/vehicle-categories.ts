import type { VehicleCategory } from "@the-ride/types";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

const COLLECTION = "vehicleCategories";

/**
 * Client-side read of the real, admin-managed ride tiers — same
 * `vehicleCategories` collection and query shape
 * `apps/web/src/app/(passenger)/book/page.tsx` already queries inline.
 * Factored out here so the passenger mobile app (and any future caller)
 * reuses one shared function instead of duplicating this query — web's
 * own inline query is left as-is, out of scope for this change.
 */
export function subscribeVehicleCategories(
  db: Firestore,
  onNext: (categories: VehicleCategory[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, COLLECTION),
    where("isActive", "==", true),
    orderBy("sortOrder", "asc"),
  );
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as VehicleCategory)),
    (err) => onError(err.message),
  );
}
