import type { IconName } from "@the-ride/ui";

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
  /** Simulated base fare (Sprint 6: "fare calculation can remain simulated for now"). */
  basePrice: number;
  perMinuteFactor: number;
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
  },
];

/** Deterministic simulated fare (Sprint 6: "The fare calculation can remain simulated for now") — stable per input rather than random on every render. */
export function estimateSimulatedFare(
  pickup: string,
  destination: string,
  vehicle: VehicleTypeInfo,
): number {
  const signal = pickup.trim().length + destination.trim().length || 6;
  const simulatedMinutes = 8 + signal * 1.4;
  return Math.round((vehicle.basePrice + simulatedMinutes * vehicle.perMinuteFactor) * 100) / 100;
}
