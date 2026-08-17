import { z } from "zod";

import { firestoreDateSchema } from "../common/firestore-date.schema";
import { VehicleStatus } from "./fleet-management.enums";

export const vehicleStatusSchema = z.nativeEnum(VehicleStatus);

/**
 * Source of truth for the `vehicles` collection document shape. Extended
 * in Sprint 4 (Part 4, matching score) with `vehicleCategoryId` — which
 * `VehicleCategory` (`packages/types/src/settings`) this physical vehicle
 * qualifies for, used as a scoring bonus (not a hard filter) when matching
 * drivers to a ride request for a specific category.
 *
 * FLOW-02A.1 — `createdAt`/`updatedAt`/`inspectionExpiresAt` were plain
 * `z.date()`, which rejects a real Firestore `Timestamp` outright
 * ("Expected date, received object"): every OTHER Firestore-backed schema
 * in this package (see `driverSchema`) already uses `firestoreDateSchema`
 * for exactly this reason. The mismatch here meant `getVehicle()`
 * (`packages/firebase/src/client/driver.ts`) threw on every real vehicle
 * document, silently resolving to `vehicle: null` for its caller and
 * making `getOnlineEligibility` report "vehicle not approved" for every
 * driver regardless of the vehicle's real status — found live while
 * testing a genuinely-activated DEV driver end-to-end.
 */
export const vehicleSchema = z.object({
  id: z.string().min(1),
  driverId: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1980),
  plateNumber: z.string().min(1),
  color: z.string().min(1),
  status: vehicleStatusSchema,
  vehicleCategoryId: z.string().optional(),
  inspectionExpiresAt: firestoreDateSchema.optional(),
  createdAt: firestoreDateSchema,
  updatedAt: firestoreDateSchema,
});

export type Vehicle = z.infer<typeof vehicleSchema>;
