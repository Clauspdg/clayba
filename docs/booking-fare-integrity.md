# Homepage Fare Integrity (BOOKING-05)

## What was wrong

`BookingCard` (the homepage lead-gen widget) showed a dollar amount
labeled "Estimated fare" the moment both Pickup and Destination had any
text in them. That number came from `estimateSimulatedFare()`
(`vehicle-types.ts`), which derived a fake "simulated minutes" value from
the **string length** of the pickup/destination text — not a distance,
not a route, not anything real. Two addresses of similar length produced
similar fares regardless of whether they were 2 km or 200 km apart.

## Why it couldn't be fixed with a real estimate (Option A rejected)

The real fare pipeline `/book` uses (`estimateRoute()` /
`estimateFareForCategory()` in `apps/web/src/lib/fare-estimate.ts`)
requires **resolved coordinates** — real `lat`/`lng` for pickup and
destination. `BookingCard` has no way to get those: no geocoding, no
"use current location", no saved places, just two plain `useState("")`
text fields. Adding geocoding to get real coordinates was explicitly out
of scope for this micro-sprint ("do not introduce a Maps/geocoding
integration solely for this micro-sprint") — and even if it weren't, this
card is a pre-signup marketing widget, not the place to duplicate `/book`'s
real booking logic.

## What changed (Option B)

The dollar amount is gone. In its place, once both fields have text, the
card shows an honest, non-monetary notice:

> "Fare calculated after route confirmation" / "Tarif calculé après
> confirmation de l'itinéraire"

No number is ever fabricated or implied. The real fare is calculated once
on `/book`, from real resolved coordinates and the real vehicle-category
pricing configuration — unchanged by this sprint.

## Removed dead code

- `estimateSimulatedFare()` (`vehicle-types.ts`) — its only call site was
  the fare box just removed. No other file referenced it.
- `website.landing.estimatedFareLabel` (EN/FR) — replaced by
  `website.landing.fareAfterRouteMessage`.

`VEHICLE_TYPES`, `VehicleTypeInfo`, and `buildDefaultVehicleCategories()`
are untouched and still in use — they're the shared "zero real categories
configured yet" fallback for both `BookingCard` and `VehicleTypeGrid`
(BOOKING-04), unrelated to the fare number that was removed here.
