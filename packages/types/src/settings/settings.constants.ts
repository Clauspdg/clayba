export const SETTINGS_COLLECTION = "settings";
export const GLOBAL_SETTINGS_DOC_ID = "global";
export const VEHICLE_CATEGORIES_COLLECTION = "vehicleCategories";

/**
 * Same literal values as `platformSettingsSchema`'s field defaults
 * (`settings.schemas.ts`) — exported once so consumers that need the
 * numbers without a live Firestore document (the passenger app's fare
 * estimate, the admin dashboard's placeholder-auth pages) don't each
 * hardcode their own copy. `commissionRate` has no schema default (it's
 * required), so this fills in a representative starting value.
 */
export const DEFAULT_PLATFORM_SETTINGS = {
  commissionRate: 0.2,
  searchRadiusKm: 5,
  assignmentTimeoutSeconds: 15,
  maxDriverOffers: 3,
  cancellationFee: 0,
  waitingFeePerMinute: 0,
  bookingFee: 0,
  serviceFeeRate: 0,
  taxRate: 0,
  surgeMultiplierDefault: 1,
  currency: "USD",
  country: "US",
  minDriverScore: 50,
  minAcceptanceRate: 0.5,
  maxCancellationRate: 0.3,
  maxActiveJobsPerDriver: 1,
  matchingWeights: {
    distance: 0.3,
    eta: 0.2,
    rating: 0.15,
    acceptanceRate: 0.1,
    completionRate: 0.1,
    recentActivity: 0.05,
    driverLevel: 0.05,
    vehicleCategoryMatch: 0.025,
    serviceZone: 0.025,
  },
} as const;

/**
 * Seed data for the six starter vehicle categories (Sprint 3, Part 3).
 * Admins can edit/add/retire categories from the dashboard afterward —
 * this is only what a fresh environment starts with.
 */
export const DEFAULT_VEHICLE_CATEGORIES: Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  maximumPassengers: number;
  sortOrder: number;
}> = [
  {
    id: "economy",
    name: "Economy",
    description: "Affordable, everyday rides.",
    icon: "car",
    color: "#0F62FE",
    baseFare: 2.5,
    perKmRate: 1.1,
    perMinuteRate: 0.18,
    minimumFare: 5,
    maximumPassengers: 4,
    sortOrder: 0,
  },
  {
    id: "comfort",
    name: "Comfort",
    description: "Newer cars with extra legroom.",
    icon: "car",
    color: "#0A44AF",
    baseFare: 3.5,
    perKmRate: 1.35,
    perMinuteRate: 0.22,
    minimumFare: 7,
    maximumPassengers: 4,
    sortOrder: 1,
  },
  {
    id: "xl",
    name: "XL",
    description: "Larger vehicles for groups.",
    icon: "users",
    color: "#16A34A",
    baseFare: 4.5,
    perKmRate: 1.6,
    perMinuteRate: 0.28,
    minimumFare: 9,
    maximumPassengers: 6,
    sortOrder: 2,
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Premium vehicles for a premium ride.",
    icon: "star",
    color: "#06265F",
    baseFare: 8,
    perKmRate: 2.4,
    perMinuteRate: 0.4,
    minimumFare: 15,
    maximumPassengers: 4,
    sortOrder: 3,
  },
  {
    id: "business",
    name: "Business",
    description: "Professional drivers for business travel.",
    icon: "shieldCheck",
    color: "#374151",
    baseFare: 7,
    perKmRate: 2.1,
    perMinuteRate: 0.35,
    minimumFare: 13,
    maximumPassengers: 4,
    sortOrder: 4,
  },
  {
    id: "accessible",
    name: "Accessible",
    description: "Wheelchair-accessible vehicles.",
    icon: "shield",
    color: "#0891B2",
    baseFare: 3,
    perKmRate: 1.2,
    perMinuteRate: 0.2,
    minimumFare: 6,
    maximumPassengers: 4,
    sortOrder: 5,
  },
];
