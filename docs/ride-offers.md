# Ride Offers (Sprint 4, Parts 5-6, 8)

A `RideOffer` is its own Firestore entity (`rideOffers` collection) — one
document per driver a trip request is offered to. Distinct from
`TripRequestStatus`: a single trip request can accumulate many offers
(one per candidate, across search-radius expansions) before one is
accepted.

## Lifecycle

```ts
enum OfferStatus {
  CREATED, SENT, VIEWED, ACCEPTED, DECLINED, EXPIRED, CANCELLED, REASSIGNED, COMPLETED
}
```

```
CREATED  -> SENT, CANCELLED
SENT     -> VIEWED, ACCEPTED, DECLINED, EXPIRED, CANCELLED
VIEWED   -> ACCEPTED, DECLINED, EXPIRED, CANCELLED
ACCEPTED -> COMPLETED, CANCELLED
DECLINED -> REASSIGNED
EXPIRED  -> REASSIGNED
CANCELLED, REASSIGNED, COMPLETED -> (terminal)
```

Enforced by `packages/utils/src/trips/offer-workflow.ts`
(`assertOfferTransition`), driven by `OFFER_TRANSITIONS` in
`packages/types/src/trips/trips.constants.ts` — same pattern as every
other lifecycle state machine in this project.

## Document shape

```ts
{
  id: string;
  tripRequestId: string;
  driverId: string;
  status: OfferStatus;
  searchRadiusKm: number;
  score: number;              // the matching engine's total score for this candidate
  distanceMeters: number;
  etaSeconds: number;
  estimatedEarnings: number;
  createdAt: Date;
  sentAt?: Date;
  viewedAt?: Date;
  respondedAt?: Date;
  expiresAt: Date;
  declineReason?: string;
  updatedAt: Date;
}
```

## The offer timer (Part 6)

Sprint 3 already introduced `PlatformSettings.assignmentTimeoutSeconds`
(default 15s) as "how long a driver has to respond to an offer." Sprint 4
reuses that exact field as the Part 6 "Offer Timer" rather than adding a
duplicate `offerTimeoutSeconds` setting — both describe the same
configurable window. `DEFAULT_OFFER_TIMEOUT_SECONDS = 15` in
`packages/types/src/drivers/drivers.constants.ts` mirrors this default
for code paths that need a constant outside of `PlatformSettings`.

`RideOffersRepository.createOffer()` sets `expiresAt = now + assignmentTimeoutSeconds`.
Expiry itself is not a background job in this sprint (no scheduled
functions) — the driver app's countdown UI (see below) calls
`handleOfferExpired()` client-side when its local timer reaches zero.

## One offer at a time, not a broadcast

`DispatchService.runMatchingAttempt()` sends the offer to only the
top-ranked eligible candidate, not every eligible driver at once. If that
driver declines or the offer expires, `handleOfferNotAccepted()`:

1. Transitions the offer to `DECLINED`/`EXPIRED`, then `REASSIGNED`.
2. Frees the driver back to `AVAILABLE`.
3. Excludes that driver from the next `buildMatchingCandidates()` call
   (`DispatchQueue.offeredDriverIds`).
4. Re-runs `dispatch()` — which re-ranks remaining candidates at the
   current (or next-expanded) search radius and offers the new top
   candidate.

This keeps the ranking logic as the single source of truth for "who's
next," rather than pre-computing a fixed ordered list that could go stale
across the offer window.

## Driver-app UI (Part 8)

`apps/driver-app/src/app/offer.tsx` — Incoming Ride Offer screen:

- Live countdown from `assignmentTimeoutSeconds` down to 0.
- Offer details: pickup, destination, estimated earnings, distance,
  passenger rating.
- Accept / Decline actions.
- No navigation UI — routing to the pickup point is a later sprint.

Because the driver app has no authenticated backend session wired up yet
(consistent with prior sprints — see `apps/driver-app/src/stores/driver-store.ts`),
Sprint 4's offer screen simulates the lifecycle against a local Zustand
store rather than subscribing to real `rideOffers` documents. The
`DispatchService` methods above are what a real integration would call.

## Related Docs

- [Matching Engine](./matching-engine.md)
- [Driver Presence](./driver-presence.md)
- [Search Radius Expansion](./search-expansion.md)
- [Dispatch Center](./dispatch-center.md)
