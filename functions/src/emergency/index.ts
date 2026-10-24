import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeAdminApp, getAdminFirestore } from "@the-ride/firebase/admin";
import { createRepositories } from "@the-ride/firebase/firestore";
import { SosIncidentStatus } from "@the-ride/types";

initializeAdminApp();

interface TriggerSosAlertData {
  tripId: string;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
}

/**
 * Real backend for the "Send SOS Alert" action in every app's Safety
 * panel. Before this, pressing SOS only opened a dialog with a `tel:`
 * emergency-number link — never actually reached anyone at Clayba. This
 * is the trusted server-side path that creates a real, staff-visible
 * `sosIncidents` document; `firestore.rules` denies client `create` on
 * that collection entirely, so this callable is the only way one gets
 * written, and the passenger/driver identity + trip link can't be forged.
 *
 * `location` is best-effort and optional — the caller (web/mobile) is
 * expected to send `undefined` rather than block the alert when the
 * device couldn't get a fix or permission was denied. A malformed
 * `location` payload is dropped rather than trusted verbatim, since it
 * would otherwise flow straight into a staff-facing admin read.
 */
export const triggerSosAlert = onCall<TriggerSosAlertData>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const tripId = request.data?.tripId;
  if (!tripId) {
    throw new HttpsError("invalid-argument", "tripId is required.");
  }

  const repos = createRepositories(getAdminFirestore());
  const trip = await repos.trips.findById(tripId);
  if (!trip) {
    throw new HttpsError("not-found", "This ride no longer exists.");
  }

  const uid = request.auth.uid;
  const triggeredBy: "passenger" | "driver" | null =
    trip.passengerId === uid ? "passenger" : trip.driverId === uid ? "driver" : null;
  if (!triggeredBy) {
    throw new HttpsError("permission-denied", "This isn't your ride.");
  }

  const rawLocation = request.data?.location;
  const location =
    rawLocation &&
    Number.isFinite(rawLocation.lat) &&
    Number.isFinite(rawLocation.lng) &&
    rawLocation.lat >= -90 &&
    rawLocation.lat <= 90 &&
    rawLocation.lng >= -180 &&
    rawLocation.lng <= 180
      ? {
          lat: rawLocation.lat,
          lng: rawLocation.lng,
          ...(Number.isFinite(rawLocation.accuracy) && (rawLocation.accuracy as number) >= 0
            ? { accuracy: rawLocation.accuracy }
            : {}),
        }
      : undefined;

  const id = repos.sosIncidents.newId();

  try {
    await repos.sosIncidents.create(id, {
      id,
      tripId,
      passengerId: trip.passengerId,
      driverId: trip.driverId,
      triggeredBy,
      status: SosIncidentStatus.OPEN,
      location,
      locationCapturedAt: location ? new Date() : undefined,
      pickupLabel: trip.pickup.address,
      dropoffLabel: trip.dropoff.address,
      createdAt: new Date(),
    });
  } catch (error) {
    logger.error("Failed to record SOS incident", { tripId, triggeredBy, uid, error });
    throw new HttpsError(
      "internal",
      "Could not send the alert. Please call emergency services directly.",
    );
  }

  // Deliberately .error, not .info — an SOS is an operational alarm and
  // should stand out in Cloud Logging severity filters.
  logger.error("SOS alert triggered", {
    incidentId: id,
    tripId,
    triggeredBy,
    uid,
    hasLocation: !!location,
  });

  return { incidentId: id };
});
