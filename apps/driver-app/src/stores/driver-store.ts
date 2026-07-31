import { DriverAvailabilityStatus } from "@the-ride/types";
import { create } from "zustand";

export interface SimulatedOffer {
  id: string;
  pickupAddress: string;
  destinationAddress: string;
  distanceMeters: number;
  etaSeconds: number;
  estimatedEarnings: number;
  passengerRating: number;
}

interface DriverState {
  availabilityStatus: DriverAvailabilityStatus;
  currentOffer: SimulatedOffer | null;
  setAvailabilityStatus: (status: DriverAvailabilityStatus) => void;
  receiveOffer: (offer: SimulatedOffer) => void;
  clearOffer: () => void;
}

/**
 * Local, in-memory shift/offer state for the driver app (Sprint 4, Part
 * 8). Same scope note as the passenger app's `booking-store.ts`: no
 * authenticated session exists yet to attach real `DriverPresenceRepository`/
 * `RideOffersRepository` writes to, so "Go Online" and "Simulate Offer"
 * drive this local state machine — the real one is fully built server-side
 * in `@the-ride/firebase`. See docs/driver-presence.md.
 */
export const useDriverStore = create<DriverState>((set) => ({
  availabilityStatus: DriverAvailabilityStatus.OFFLINE,
  currentOffer: null,
  setAvailabilityStatus: (status) => set({ availabilityStatus: status }),
  receiveOffer: (offer) => set({ currentOffer: offer }),
  clearOffer: () => set({ currentOffer: null }),
}));
