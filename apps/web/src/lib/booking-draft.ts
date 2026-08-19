import type { GeoLocation } from "@the-ride/types";

const STORAGE_KEY = "ride-booking-draft";

export interface BookingDraftAddress {
  text: string;
  location: GeoLocation | null;
}

export interface BookingDraft {
  pickup: BookingDraftAddress;
  destination: BookingDraftAddress;
  stops: BookingDraftAddress[];
  passengerCount: number;
  scheduleMode: "now" | "later";
  scheduledDate: string;
  scheduledTime: string;
  selectedCategoryId: string | null;
}

/**
 * FUNCTIONAL-STABILIZATION — `/book`'s form previously lived entirely in
 * React state with no persistence: a reload, an accidental back-navigation,
 * or opening a saved place in another tab lost everything the passenger had
 * entered. `sessionStorage` (not `localStorage`) deliberately scopes this to
 * "the current tab session" — it should not survive closing the browser or
 * leak into a different signed-in session on the same device. This is a
 * DRAFT only; a successful `createTripRequest` clears it via
 * `clearBookingDraft()` so a confirmed Ride is never confused with one.
 */
export function loadBookingDraft(): BookingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookingDraft;
  } catch {
    return null;
  }
}

export function saveBookingDraft(draft: BookingDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Private-browsing storage limits, quota, etc. — losing draft
    // persistence is not worth surfacing an error over.
  }
}

export function clearBookingDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — see saveBookingDraft.
  }
}
