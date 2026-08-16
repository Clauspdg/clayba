# Homepage Safety Section — Functionality Audit

Micro-sprint HOME-07A required auditing which safety capabilities are
genuinely backed by working code before deciding what to visually
present on the homepage Safety section (`SafetyExperience.tsx`). This
records that audit so the reasoning behind the visual choices — and
which claims are illustrative rather than live — stays traceable.

## Genuinely implemented (safe to represent as real)

| Capability                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Verified drivers**           | Real `DriverApplicationStatus` pipeline (draft → submitted → documents_pending → background_check → vehicle_inspection → interview → approved → activated) and per-document `DocumentReviewStatus`, with real Firestore-backed admin actions (`apps/admin/src/lib/driver-admin.ts`, `ApplicationReviewWorkspace.tsx`) and tested transition logic (`packages/utils/src/drivers/document-review.ts`). |
| **Trip status**                | Real `TripStatus` state machine (requested/matched/en_route_to_pickup/arrived/in_progress/completed/cancelled, `packages/types/src/trips/trips.enums.ts`) with guarded transitions (`packages/utils/src/trips/trip-status-workflow.ts`) and real Firestore reads/writes (`packages/firebase/src/client/driver-trips.ts`), driven from the driver's Current Ride page.                                |
| **Vehicle eligibility gating** | Real `VehicleStatus` enum drives whether a driver can go online (`packages/utils/src/drivers/online-eligibility.ts`, tested). Caveat: this is gating logic tied to the driver's own document approval, not an independent vehicle-document review flow — the homepage does not claim a separate inspection step.                                                                                     |
| **Emergency contacts**         | Full real CRUD — schema (`packages/types/src/emergency/emergency.schemas.ts`), Firestore repository/client (`packages/firebase/src/client/emergency-contacts.ts`), live UI on the passenger profile page. Not surfaced as a new homepage claim this sprint (see below), but confirmed real for future reference.                                                                                     |

## Marketing copy only — no backing implementation found

| Capability                       | Where the claim exists                                                              | What's actually missing                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **"Trusted Contact"**            | Copy only (`website.safety.emergencyContactsBody`)                                  | No auto-notify-on-trip logic; the real feature is plain contact storage (see Emergency contacts above), not a "trusted contact" system.                               |
| **Trip sharing**                 | Copy only (`website.safety.tripSharingTitle/Body`)                                  | No share link/token/endpoint anywhere in the codebase.                                                                                                                |
| **Continuous live GPS tracking** | Copy only (existing homepage `safety2`/`mapPreview` text, `website.safety.gpsBody`) | `Trip`/`TripRequest` schemas have only static pickup/dropoff points — no `currentLocation` field, no `watchPosition` usage, no location writes during an active trip. |
| **SOS / emergency button**       | Copy only (`website.safety.sosTitle/Body`)                                          | The emergency feature folders across every app (`apps/*/src/features/emergency`, `functions/src/emergency`) are literal one-line placeholder stubs.                   |
| **Trip PIN**                     | Not even present in copy                                                            | No trace anywhere in code or translations.                                                                                                                            |

## What this sprint actually changed

The three existing homepage safety cards (`safety1`/`safety2`/`safety3` —
"Verified drivers", "Real-time GPS", "24/7 support") and all of their
translated copy are **unchanged** — this sprint did not touch content.
What changed is presentation:

- The GPS/tracking card (`icon: "mapPin"`) becomes the **featured**
  panel, paired with an illustrative trip-status timeline built from
  the real `tripStatus.*` translation keys (the same strings the driver
  app uses for its real state machine) — **explicitly labeled "Preview"**
  (reusing the same honesty chip introduced for the Map Preview in
  HOME-06A) so it reads as a static example, never as a live feed for
  the visitor's own (nonexistent, pre-signup) trip.
- The "Verified drivers" card gets a small row of decorative,
  `aria-hidden` icons (document / vehicle / rating) — no new text, no
  new claims, just reinforcing a capability that audits confirm is real.
- Nothing about "Trusted Contact," trip sharing, live GPS coordinates,
  SOS, or Trip PIN was newly depicted as available, since none of them
  are backed by real functionality today.
