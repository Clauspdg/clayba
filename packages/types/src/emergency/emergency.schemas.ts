import { z } from "zod";

import { firestoreDateSchema } from "../common/firestore-date.schema";
import { geoLocationSchema } from "../trips/trips.schemas";

/** Source of truth for the `emergencyContacts` collection document shape. */
export const emergencyContactSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  phoneNumber: z.string().min(1),
  relationship: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EmergencyContact = z.infer<typeof emergencyContactSchema>;

/**
 * Lifecycle of a real SOS alert (`sosIncidents` collection), triggered by
 * `triggerSosAlert` and worked by admin/dispatch — never client-writable
 * (see `firestore.rules`), so this schema is trusted server data, not
 * user input.
 */
export enum SosIncidentStatus {
  OPEN = "open",
  ACKNOWLEDGED = "acknowledged",
  RESOLVED = "resolved",
}

export const sosIncidentStatusSchema = z.nativeEnum(SosIncidentStatus);

/**
 * A real SOS alert. Created only by the `triggerSosAlert` Cloud Function
 * (never a direct client write) so the passenger/driver identity, trip
 * link, and timestamp can't be forged. `location` is best-effort and
 * genuinely absent (not zeroed/guessed) when the device couldn't get a
 * fix or the user denied permission — the alert must never be blocked on
 * location, only enriched by it when available.
 */
export const sosIncidentSchema = z.object({
  id: z.string().min(1),
  tripId: z.string().min(1),
  passengerId: z.string().min(1),
  driverId: z.string().optional(),
  triggeredBy: z.enum(["passenger", "driver"]),
  status: sosIncidentStatusSchema,
  location: geoLocationSchema.extend({ accuracy: z.number().min(0).optional() }).optional(),
  locationCapturedAt: firestoreDateSchema.optional(),
  pickupLabel: z.string().optional(),
  dropoffLabel: z.string().optional(),
  createdAt: firestoreDateSchema,
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: firestoreDateSchema.optional(),
  resolvedBy: z.string().optional(),
  resolvedAt: firestoreDateSchema.optional(),
  resolutionNote: z.string().optional(),
});

export type SosIncident = z.infer<typeof sosIncidentSchema>;
