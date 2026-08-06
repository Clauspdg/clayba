import { z } from "zod";

import {
  DriverAccountStatus,
  DriverApplicationStatus,
  DriverAvailabilityStatus,
  DriverDocumentType,
} from "./drivers.enums";
import { firestoreDateSchema } from "../common/firestore-date.schema";
import { geoLocationSchema } from "../trips/trips.schemas";

export const driverApplicationStatusSchema = z.nativeEnum(DriverApplicationStatus);
export const driverAccountStatusSchema = z.nativeEnum(DriverAccountStatus);
export const driverDocumentTypeSchema = z.nativeEnum(DriverDocumentType);
export const driverAvailabilityStatusSchema = z.nativeEnum(DriverAvailabilityStatus);

/** Source of truth for the `driverApplications` collection document shape. */
export const driverApplicationSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  status: driverApplicationStatusSchema,
  submittedAt: firestoreDateSchema.optional(),
  reviewedBy: z.string().optional(),
  rejectionReason: z.string().optional(),
  createdAt: firestoreDateSchema,
  updatedAt: firestoreDateSchema,
});

export type DriverApplication = z.infer<typeof driverApplicationSchema>;

export const driverDocumentSchema = z.object({
  type: driverDocumentTypeSchema,
  url: z.string().url(),
  expiresAt: firestoreDateSchema.optional(),
  verifiedAt: firestoreDateSchema.optional(),
});

export type DriverDocument = z.infer<typeof driverDocumentSchema>;

/**
 * Source of truth for the `drivers` collection document shape. Extended in
 * Sprint 3 (Part 6, dispatch eligibility) with online/location fields, and
 * in Sprint 4 (Parts 1/3/4) with a richer availability status and the
 * stats the matching engine filters/scores on — all new fields are
 * defaulted/optional so earlier sprints' documents still validate
 * unchanged.
 */
export const driverSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  applicationId: z.string().min(1),
  status: driverAccountStatusSchema,
  vehicleId: z.string().optional(),
  documents: z.array(driverDocumentSchema).default([]),
  rating: z.number().min(0).max(5).default(0),
  completedTrips: z.number().int().min(0).default(0),
  warningsCount: z.number().int().min(0).default(0),
  score: z.number().min(0).max(100).default(100),
  /** @deprecated Sprint 1 placeholder — superseded by `availabilityStatus` (Sprint 4). Kept in sync one-way by `DriversRepository.setAvailabilityStatus()` for any Sprint 3 code still reading it. */
  isOnline: z.boolean().default(false),
  /** @deprecated see `isOnline`. */
  isAvailable: z.boolean().default(false),
  /** Real-time shift/presence status — see `DriverAvailabilityStatus` and docs/driver-presence.md. */
  availabilityStatus: driverAvailabilityStatusSchema.default(DriverAvailabilityStatus.OFFLINE),
  /** Why the driver isn't `AVAILABLE` right now, e.g. `"on_break"`, `"suspended_by_admin"` — free-form, for driver-app display. */
  availabilityReason: z.string().optional(),
  lastKnownLocation: geoLocationSchema.optional(),
  lastLocationUpdatedAt: firestoreDateSchema.optional(),
  /** Fraction (0-1) of offers accepted out of offers received — matching engine filter/score input. */
  acceptanceRate: z.number().min(0).max(1).default(1),
  /** Fraction (0-1) of accepted rides subsequently cancelled by the driver. */
  cancellationRate: z.number().min(0).max(1).default(0),
  /** How many rides this driver is currently committed to (0 or 1 in this sprint — no ride queuing yet). */
  activeJobsCount: z.number().int().min(0).default(0),
  createdAt: firestoreDateSchema,
  updatedAt: firestoreDateSchema,
});

export type Driver = z.infer<typeof driverSchema>;

/** One device a driver has signed in on — see docs/driver-presence.md ("support multiple devices safely"). */
export const driverDeviceSchema = z.object({
  platform: z.enum(["ios", "android", "web"]),
  lastActiveAt: firestoreDateSchema,
});

export type DriverDevice = z.infer<typeof driverDeviceSchema>;

/**
 * Source of truth for the `driverPresence` collection document shape
 * (Sprint 4, Part 2). Document id === driverId (one presence document per
 * driver). Kept separate from the `drivers` collection because presence
 * changes on every heartbeat — far too high-frequency to co-locate with
 * the driver profile document without generating write-amplification and
 * audit noise on every heartbeat.
 */
export const driverPresenceSchema = z.object({
  id: z.string().min(1),
  driverId: z.string().min(1),
  status: driverAvailabilityStatusSchema,
  availabilityReason: z.string().optional(),
  /** Set while `status` is `BUSY` (offer pending) or `ON_TRIP`. */
  currentRideId: z.string().optional(),
  lastHeartbeatAt: firestoreDateSchema,
  lastSeenAt: firestoreDateSchema,
  /** When the current online session started — cleared when `status` returns to `OFFLINE`. Used to compute online duration. */
  onlineSince: firestoreDateSchema.optional(),
  /** Keyed by deviceId. */
  devices: z.record(driverDeviceSchema).default({}),
  updatedAt: firestoreDateSchema,
});

export type DriverPresence = z.infer<typeof driverPresenceSchema>;

/** Source of truth for the `driverWarnings` collection document shape. */
export const driverWarningSchema = z.object({
  id: z.string().min(1),
  driverId: z.string().min(1),
  reason: z.string().min(1),
  issuedBy: z.string().min(1),
  createdAt: firestoreDateSchema,
});

export type DriverWarning = z.infer<typeof driverWarningSchema>;

/** Source of truth for the `driverSuspensions` collection document shape. */
export const driverSuspensionSchema = z.object({
  id: z.string().min(1),
  driverId: z.string().min(1),
  reason: z.string().min(1),
  suspendedBy: z.string().min(1),
  startAt: firestoreDateSchema,
  endAt: firestoreDateSchema.optional(),
  liftedAt: firestoreDateSchema.optional(),
  liftedBy: z.string().optional(),
  createdAt: firestoreDateSchema,
});

export type DriverSuspension = z.infer<typeof driverSuspensionSchema>;

/** Derived read-model, not persisted as its own document. */
export const driverStatisticsSchema = z.object({
  driverId: z.string().min(1),
  totalTrips: z.number().int().min(0),
  completedTrips: z.number().int().min(0),
  cancelledTrips: z.number().int().min(0),
  averageRating: z.number().min(0).max(5),
  totalEarnings: z.number().min(0),
  warningsCount: z.number().int().min(0),
  score: z.number().min(0).max(100),
});

export type DriverStatistics = z.infer<typeof driverStatisticsSchema>;
