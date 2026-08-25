import type { FareBreakdown, GeoLocation, VehicleCategory } from "@the-ride/types";
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
  selectedCategory: VehicleCategory | null;
  route: RouteEstimate | null;
  fareEstimate: FareBreakdown | null;
  status: BookingStatus;
  /** The real `tripRequests` doc id once `createTripRequest` has run — set by `booking/confirm.tsx`. */
  tripRequestId: string | null;
  /**
   * Transient hand-off slot for `booking/location-search.tsx`'s
   * `target=favorite` mode — Saved Places' "add/edit place" screen reuses
   * the same real address-search screen the booking flow uses (one
   * search implementation, not a second one) rather than a plain text
   * field. Set on select, consumed and cleared by the Saved Places screen.
   */
  favoriteDraft: (GeoLocation & { address?: string }) | null;

  setPickup: (location: GeoLocation) => void;
  setDestination: (location: GeoLocation) => void;
  addStop: (location: GeoLocation) => void;
  removeStop: (index: number) => void;
  setVehicleCategoryId: (id: string, category: VehicleCategory) => void;
  setEstimate: (route: RouteEstimate, fareEstimate: FareBreakdown) => void;
  confirm: (tripRequestId: string) => void;
  cancel: () => void;
  reset: () => void;
  setFavoriteDraft: (location: GeoLocation) => void;
  clearFavoriteDraft: () => void;
}

const initialState = {
  pickup: null,
  destination: null,
  stops: [],
  vehicleCategoryId: null,
  selectedCategory: null,
  route: null,
  fareEstimate: null,
  status: "idle" as BookingStatus,
  tripRequestId: null,
  favoriteDraft: null,
};

/**
 * Local, in-memory booking-flow state for the passenger app. Not persisted
 * to Firestore itself — once `confirm()` is called (from `booking/confirm.tsx`,
 * after a real `createTripRequest` call succeeds), the source of truth for
 * everything about the request/trip becomes the real `tripRequests`/`trips`
 * Firestore documents, watched live via `subscribeMyTripRequests`/
 * `subscribeMyTrips` — this store only carries the wizard's in-progress
 * selections up to that point.
 */
export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,
  setPickup: (location) => set({ pickup: location }),
  setDestination: (location) => set({ destination: location }),
  addStop: (location) => set((state) => ({ stops: [...state.stops, location] })),
  removeStop: (index) => set((state) => ({ stops: state.stops.filter((_, i) => i !== index) })),
  setVehicleCategoryId: (id, category) =>
    set({ vehicleCategoryId: id, selectedCategory: category }),
  setEstimate: (route, fareEstimate) => set({ route, fareEstimate }),
  confirm: (tripRequestId) => set({ status: "searching", tripRequestId }),
  cancel: () => set({ status: "cancelled" }),
  reset: () => set({ ...initialState }),
  setFavoriteDraft: (location) => set({ favoriteDraft: location }),
  clearFavoriteDraft: () => set({ favoriteDraft: null }),
}));
