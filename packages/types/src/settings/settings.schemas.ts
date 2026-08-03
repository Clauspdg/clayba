import { z } from "zod";

/**
 * Source of truth for the `settings` collection document shape. This is a
 * platform-wide singleton document (id: "global") holding operational
 * knobs that must be editable without a redeploy.
 *
 * Extended in Sprint 3 (Part 7, "Admin Configuration") with ride-request
 * config — every new field is defaulted so Sprint 1's original (smaller)
 * shape still validates unchanged.
 */
export const platformSettingsSchema = z.object({
  id: z.string().min(1),
  commissionRate: z.number().min(0).max(1),
  supportEmail: z.string().email(),
  maintenanceMode: z.boolean().default(false),
  featureFlags: z.record(z.boolean()).default({}),
  /** Driver search radius for dispatch, in kilometers. */
  searchRadiusKm: z.number().min(0).default(5),
  /** How long a driver has to respond to an offer before it moves to the next candidate. */
  assignmentTimeoutSeconds: z.number().int().min(0).default(15),
  /** Cap on how many drivers get offered a single ride request before it's marked "no drivers available". */
  maxDriverOffers: z.number().int().min(1).default(3),
  cancellationFee: z.number().min(0).default(0),
  waitingFeePerMinute: z.number().min(0).default(0),
  bookingFee: z.number().min(0).default(0),
  /** Fraction of the fare subtotal (0-1) — placeholder until a real fee schedule ships. */
  serviceFeeRate: z.number().min(0).max(1).default(0),
  /** Placeholder — always 0 until tax rules ship. */
  taxRate: z.number().min(0).max(1).default(0),
  /** Placeholder — always 1 until real surge pricing ships. */
  surgeMultiplierDefault: z.number().min(1).default(1),
  currency: z.string().length(3).default("USD"),
  country: z.string().length(2).default("US"),
  /**
   * Matching engine filter thresholds (Sprint 4, Part 3). Note:
   * `assignmentTimeoutSeconds` above (Sprint 3) *is* the Part 6 "Offer
   * Timer" — both describe "how long a driver has to respond to an
   * offer," so Sprint 4 reuses it rather than adding a duplicate
   * `offerTimeoutSeconds` field. See docs/ride-offers.md.
   */
  minDriverScore: z.number().min(0).max(100).default(50),
  minAcceptanceRate: z.number().min(0).max(1).default(0.5),
  maxCancellationRate: z.number().min(0).max(1).default(0.3),
  maxActiveJobsPerDriver: z.number().int().min(1).default(1),
  /** Matching score weights (Sprint 4, Part 4) — must sum to ~1 but this isn't enforced, matching real-world "tune and see" configuration. */
  matchingWeights: z
    .object({
      distance: z.number().min(0).default(0.3),
      eta: z.number().min(0).default(0.2),
      rating: z.number().min(0).default(0.15),
      acceptanceRate: z.number().min(0).default(0.1),
      completionRate: z.number().min(0).default(0.1),
      recentActivity: z.number().min(0).default(0.05),
      driverLevel: z.number().min(0).default(0.05),
      vehicleCategoryMatch: z.number().min(0).default(0.025),
      serviceZone: z.number().min(0).default(0.025),
    })
    .default({
      distance: 0.3,
      eta: 0.2,
      rating: 0.15,
      acceptanceRate: 0.1,
      completionRate: 0.1,
      recentActivity: 0.05,
      driverLevel: 0.05,
      vehicleCategoryMatch: 0.025,
      serviceZone: 0.025,
    }),
  updatedBy: z.string().min(1),
  updatedAt: z.date(),
});

export type PlatformSettings = z.infer<typeof platformSettingsSchema>;
export type MatchingWeights = PlatformSettings["matchingWeights"];

/**
 * Source of truth for the `vehicleCategories` collection document shape
 * (Sprint 3, Part 3). Fully admin-configurable — this is data, not a fixed
 * enum, so operators can add/edit/retire categories without a deploy.
 */
export const vehicleCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  /** `@the-ride/ui` icon registry key (see `packages/ui/src/tokens/icons.ts`). */
  icon: z.string().min(1),
  /** Hex color used for badges and map markers. */
  color: z.string().min(1),
  /** Marketing-site card photo (Sprint 7.2 Site Content CMS) — purely cosmetic, no effect on fare/dispatch logic. Falls back to an illustrated SVG when unset. */
  imageUrl: z.string().url().optional(),
  baseFare: z.number().min(0),
  perKmRate: z.number().min(0),
  perMinuteRate: z.number().min(0),
  minimumFare: z.number().min(0),
  maximumPassengers: z.number().int().min(1),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type VehicleCategory = z.infer<typeof vehicleCategorySchema>;

export const createVehicleCategoryInputSchema = vehicleCategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateVehicleCategoryInput = z.infer<typeof createVehicleCategoryInputSchema>;
