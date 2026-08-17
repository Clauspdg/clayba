# Homepage Booking Handoff — Audit & Fix (BOOKING-01)

## What was broken

The homepage `BookingCard` and the real authenticated `/book` page
(`apps/web/src/app/(passenger)/book`) were two fully independent
implementations sharing no data channel — `handleFindRide()` navigated to
`/book` (or `/register`) with no query params, no shared store, and no
`localStorage`. A passenger who filled in pickup/destination/stops/
passenger count/date on the homepage arrived at `/book` to a blank form.
The guest path was worse: signup → email verification landed on
`/dashboard`, with no memory a booking was ever started, despite `/login`
and `/verify-email` already supporting a `?next=` continuation param.

## What this fix does

- `BookingCard.handleFindRide()` now builds `/book?pickup=...&destination=
...&stop=...&passengers=...&scheduledDate=...&scheduledTime=...` and
  navigates there directly for an authenticated visitor, or to
  `/register?next=<that URL>` for a guest.
- `/register` reads its own `?next=` and relays it through
  `/verify-email?next=...` (already-existing, already-working
  continuation logic) — unless the visitor picked the driver role, which
  still takes priority.
- `/book` reads `?pickup=`/`?destination=`/`?stop=`/`?passengers=`/
  `?scheduledDate=`/`?scheduledTime=` on mount, pre-fills the matching
  fields, and immediately runs the same geocode attempt a manual blur
  would trigger — same honest success/"address lookup unavailable"
  outcome as typing it in by hand (no geocoding key exists in this
  environment; that gap is unchanged, just no longer forces a re-type
  too).
- `RequireAuth` now preserves the page the visitor was actually headed to
  (`?next=`) when bouncing an unauthenticated session to `/login`, instead
  of always forgetting it.
- `/book` now checks `capabilities.canBookRide` (already computed by
  `resolveUserExperience`, previously unused anywhere) and redirects a
  staff/admin account away — the one authenticated state with no passenger
  capability. Guest is already blocked by `RequireAuth`; driver-applicant
  and active/suspended/inactive-driver states retain `canBookRide` by
  design and are unaffected.

## Deliberately not carried across the handoff

- **`BookingCard`'s selected vehicle type.** It's an ID into the local
  hardcoded `VEHICLE_TYPES` array, not the real Firestore
  `vehicleCategories` collection `/book` reads — the two ID spaces don't
  correspond, so carrying it forward would silently select the wrong (or
  a nonexistent) category. The passenger re-picks a real category on
  `/book`, where real pricing lives.
- **`BookingCard`'s "notes" field.** `/book` has no notes field; adding
  one is a schema change, not a handoff fix.
- **`BookingCard`'s simulated fare** (`estimateSimulatedFare` — a
  string-length heuristic, not a distance calculation). Not fixed here:
  doing so honestly would require geocoding the homepage's plain-text
  fields, which hits the same missing-Maps-key gap already documented for
  `/book` itself. The passenger now sees the real fare within seconds of
  landing on `/book` regardless.

## Related pre-existing regression fixed in passing

Adding `useSearchParams()` to `RequireAuth` (shared by every passenger
_and_ driver page via `RequireDriverAccess`) broke static-export
prerendering for the whole site. Fixed by isolating the search-params
read in an internal `RedirectToLogin` component wrapped in its own
`Suspense` boundary, so no consumer needed to change. `/book` and
`/register` also needed the same `PageContent` + `Suspense` wrapper
pattern already used by `/login` and `/verify-email`.

## Related pre-existing bug found live while verifying the fix

The homepage's own `preferredLandingRoute` redirect (`page.tsx`) fired
1200ms after it resolved, unconditionally — with no regard for whether
the visitor was actively using the page. In practice this meant a
signed-in passenger got yanked from `/` to `/dashboard` about 1.2 seconds
after load _regardless of interaction_, cutting off anyone still typing
into BookingCard — discovered because it broke live verification of the
handoff fix above. Fixed by cancelling the pending redirect on the first
pointer or keyboard interaction anywhere on the page.
