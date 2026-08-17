import type { IconName } from "@the-ride/ui";
import type { VehicleCategory } from "@the-ride/types";

export interface VehicleTypeInfo {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: IconName;
  capacity: number;
  luggage: number;
  hasAc: boolean;
  hasWifi: boolean;
  rating: number;
  /**
   * BOOKING-05 — no longer feeds a homepage-displayed fare (the fake
   * string-length "simulated fare" was removed; see `docs/booking-fare-
   * integrity.md`). Still real, meaningful default catalog pricing:
   * `buildDefaultVehicleCategories()` maps this into `baseFare` for both
   * homepage surfaces' "zero real categories configured yet" fallback.
   */
  basePrice: number;
  perMinuteFactor: number;
  /** Bundled local photo shown on the homepage Ride Categories card (HOME-05B.1) — purely cosmetic, falls back to VehicleIllustration if unset/unloadable. See docs/vehicle-media-license.md. */
  imageUrl?: string;
}

export const VEHICLE_TYPES: VehicleTypeInfo[] = [
  {
    id: "economy",
    nameKey: "website.vehicleTypes.economy.name",
    descriptionKey: "website.vehicleTypes.economy.description",
    icon: "car",
    capacity: 4,
    luggage: 2,
    hasAc: true,
    hasWifi: false,
    rating: 4.7,
    basePrice: 5,
    perMinuteFactor: 1,
    imageUrl: "/media/vehicles/economy.jpg",
  },
  {
    id: "comfort",
    nameKey: "website.vehicleTypes.comfort.name",
    descriptionKey: "website.vehicleTypes.comfort.description",
    icon: "car",
    capacity: 4,
    luggage: 3,
    hasAc: true,
    hasWifi: true,
    rating: 4.8,
    basePrice: 7,
    perMinuteFactor: 1.25,
    imageUrl: "/media/vehicles/comfort.jpg",
  },
  {
    id: "suv",
    nameKey: "website.vehicleTypes.suv.name",
    descriptionKey: "website.vehicleTypes.suv.description",
    icon: "car",
    capacity: 6,
    luggage: 5,
    hasAc: true,
    hasWifi: true,
    rating: 4.8,
    basePrice: 9,
    perMinuteFactor: 1.5,
    imageUrl: "/media/vehicles/suv.jpg",
  },
  {
    id: "van",
    nameKey: "website.vehicleTypes.van.name",
    descriptionKey: "website.vehicleTypes.van.description",
    icon: "users",
    capacity: 8,
    luggage: 6,
    hasAc: true,
    hasWifi: false,
    rating: 4.6,
    basePrice: 11,
    perMinuteFactor: 1.7,
    imageUrl: "/media/vehicles/van.jpg",
  },
  {
    id: "premium",
    nameKey: "website.vehicleTypes.premium.name",
    descriptionKey: "website.vehicleTypes.premium.description",
    icon: "star",
    capacity: 4,
    luggage: 3,
    hasAc: true,
    hasWifi: true,
    rating: 4.9,
    basePrice: 14,
    perMinuteFactor: 2,
    imageUrl: "/media/vehicles/premium.jpg",
  },
  {
    id: "luxury",
    nameKey: "website.vehicleTypes.luxury.name",
    descriptionKey: "website.vehicleTypes.luxury.description",
    icon: "shieldCheck",
    capacity: 4,
    luggage: 4,
    hasAc: true,
    hasWifi: true,
    rating: 5,
    basePrice: 20,
    perMinuteFactor: 2.6,
    imageUrl: "/media/vehicles/luxury.jpg",
  },
];

/**
 * BOOKING-04 — the shared "zero real categories configured yet" fallback,
 * shaped as real `VehicleCategory` records so both homepage surfaces
 * (`VehicleTypeGrid`, `BookingCard`) can hand it straight to
 * `useVehicleCategories` instead of each hand-rolling their own mapping
 * from the bundled `VEHICLE_TYPES`. `perMinuteRate` is populated from
 * `perMinuteFactor` (the grid never read it, since it only ever displays
 * `baseFare`, but `BookingCard`'s simulated-fare calculation needs it).
 */
export function buildDefaultVehicleCategories(t: (key: string) => string): VehicleCategory[] {
  return VEHICLE_TYPES.map((vehicle, index) => ({
    id: vehicle.id,
    name: t(vehicle.nameKey),
    description: t(vehicle.descriptionKey),
    icon: vehicle.icon,
    color: "#E86A2F",
    imageUrl: vehicle.imageUrl,
    baseFare: vehicle.basePrice,
    perKmRate: 0,
    perMinuteRate: vehicle.perMinuteFactor,
    minimumFare: 0,
    maximumPassengers: vehicle.capacity,
    isActive: true,
    sortOrder: index,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

/**
 * BOOKING-04 — the safest presentation mapping from a real, admin-entered
 * Firestore category (arbitrary name, no `imageUrl` of its own) to one of
 * the six bundled, licensed photos: match against the same semantic names
 * the bundled set itself uses (EN/FR). A category with no photo AND no
 * name match falls through to the existing generic `VehicleIllustration`
 * instead of guessing — never assigning a photo that might not actually
 * represent the vehicle class an admin meant.
 */
const BUNDLED_IMAGE_BY_KEYWORD: { keywords: string[]; imageUrl: string }[] = [
  { keywords: ["economy", "économique", "eco"], imageUrl: "/media/vehicles/economy.jpg" },
  { keywords: ["comfort", "confort"], imageUrl: "/media/vehicles/comfort.jpg" },
  { keywords: ["suv"], imageUrl: "/media/vehicles/suv.jpg" },
  { keywords: ["van", "fourgonnette"], imageUrl: "/media/vehicles/van.jpg" },
  { keywords: ["premium"], imageUrl: "/media/vehicles/premium.jpg" },
  { keywords: ["luxury", "luxe"], imageUrl: "/media/vehicles/luxury.jpg" },
];

export function getBundledImageForCategoryName(name: string): string | undefined {
  const normalized = name.trim().toLowerCase();
  return BUNDLED_IMAGE_BY_KEYWORD.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  )?.imageUrl;
}
