import type { FareBreakdown, GeoLocation } from "@the-ride/types";
import { create } from "zustand";

export type BookingStatus = "idle" | "searching" | "cancelled";

interface RouteEstimate {
  distanceMeters: number;
  durationSeconds: number;
}

interface BookingState {
  pickup: GeoLocation | null;
  destination: GeoLocation | null;
  stops: GeoLocation[];
  vehicleCategoryId: string | null;
  route: RouteEstimate | null;
  fareEstimate: FareBreakdown | null;
  status: BookingStatus;

  setPickup: (location: GeoLocation) => void;
  setDestination: (location: GeoLocation) => void;
  addStop: (location: GeoLocation) => void;
  removeStop: (index: number) => void;
  setVehicleCategoryId: (id: string) => void;
  setEstimate: (route: RouteEstimate, fareEstimate: FareBreakdown) => void;
  confirm: () => void;
  cancel: () => void;
  reset: () => void;
}

const initialState = {
  pickup: null,
  destination: null,
  stops: [],
  vehicleCategoryId: null,
  route: null,
  fareEstimate: null,
  status: "idle" as BookingStatus,
};

/**
 * Local, in-memory booking-flow state for the passenger app (Sprint 3,
 * Part 1). Not persisted to Firestore this sprint — there's no
 * authenticated passenger session yet (see docs/ride-request.md, "Scope
 * note"). The backend ride-request engine this state would eventually
 * post to is fully built in `@the-ride/firebase`'s `TripRequestsRepository`.
 */
export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,
  setPickup: (location) => set({ pickup: location }),
  setDestination: (location) => set({ destination: location }),
  addStop: (location) => set((state) => ({ stops: [...state.stops, location] })),
  removeStop: (index) => set((state) => ({ stops: state.stops.filter((_, i) => i !== index) })),
  setVehicleCategoryId: (id) => set({ vehicleCategoryId: id }),
  setEstimate: (route, fareEstimate) => set({ route, fareEstimate }),
  confirm: () => set({ status: "searching" }),
  cancel: () => set({ status: "cancelled" }),
  reset: () => set({ ...initialState }),
}));
