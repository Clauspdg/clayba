import { z } from "zod";

import { VehicleStatus } from "./fleet-management.enums";

export const vehicleStatusSchema = z.nativeEnum(VehicleStatus);

/**
 * Source of truth for the `vehicles` collection document shape. Extended
 * in Sprint 4 (Part 4, matching score) with `vehicleCategoryId` — which
 * `VehicleCategory` (`packages/types/src/settings`) this physical vehicle
 * qualifies for, used as a scoring bonus (not a hard filter) when matching
 * drivers to a ride request for a specific category.
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
  inspectionExpiresAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Vehicle = z.infer<typeof vehicleSchema>;
