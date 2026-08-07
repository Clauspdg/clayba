import {
  createVehicleCategoryInputSchema,
  type CreateVehicleCategoryInput,
  type VehicleCategory,
} from "@the-ride/types";
import {
  deleteDoc,
  doc,
  collection,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";

/**
 * Admin-dashboard vehicle category CRUD (Web Phase W1, Parts 5-6) — direct
 * client Firestore writes, authorized by `firestore.rules`'s `isAdmin()`
 * check on `vehicleCategories` (public read, admin-only write). Validated
 * client-side with the same `createVehicleCategoryInputSchema` the
 * Admin-SDK repository uses, so shape/range errors surface before the
 * write rather than as an opaque rules-denied failure.
 */

export async function createVehicleCategory(
  db: Firestore,
  input: CreateVehicleCategoryInput,
): Promise<void> {
  const parsed = createVehicleCategoryInputSchema.parse(input);
  const ref = doc(collection(db, "vehicleCategories"));
  await setDoc(ref, {
    ...parsed,
    id: ref.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateVehicleCategory(
  db: Firestore,
  id: string,
  input: CreateVehicleCategoryInput,
): Promise<void> {
  const parsed = createVehicleCategoryInputSchema.parse(input);
  await updateDoc(doc(db, "vehicleCategories", id), { ...parsed, updatedAt: serverTimestamp() });
}

export async function deleteVehicleCategory(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, "vehicleCategories", id));
}

export function toCreateInput(category: VehicleCategory): CreateVehicleCategoryInput {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = category;
  return rest;
}
