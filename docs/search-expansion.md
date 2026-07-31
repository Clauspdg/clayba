# Search Radius Expansion (Sprint 4, Part 7)

When no eligible driver is found at the current search radius, the
dispatch cycle widens the search rather than giving up immediately.

## Tiers

```ts
export const SEARCH_RADIUS_EXPANSION_KM = [2, 5, 10, 15] as const;
```

Four fixed tiers, tried in order: 2 km, then 5 km, then 10 km, then
15 km. `DispatchQueue.expansionAttempt` (0-indexed) selects which tier is
current. Once every tier has been tried with no eligible driver, the
queue is marked `exhausted` and the caller surfaces "no driver found" to
the passenger.

## Pure helpers

`packages/utils/src/trips/search-expansion.ts`:

| Function | Purpose |
| --- | --- |
| `getRadiusForAttempt(attempt)` | Returns the km value for a 0-indexed attempt, or `undefined` past the last tier |
| `hasMoreExpansionTiers(attempt)` | Whether there's a next tier to try |
| `isFinalExpansionTier(attempt)` | Whether this is the last configured tier |
| `getExpansionTierCount()` | Total tier count — for progress UI ("searching 2 of 4") |

## Orchestration: `DispatchService.dispatch()`

```
1. Load or create the DispatchQueue for this trip request (starts at attempt 0, radius 2km).
2. Loop from queue.expansionAttempt upward:
   a. If getRadiusForAttempt(attempt) is undefined -> mark queue exhausted,
      record a "no_drivers_found" dispatch event, throw NoDriversAvailableError.
   b. If this attempt is past where the queue already was, expand the queue
      to this radius/attempt and record a "radius_expanded" dispatch event.
   c. Run one matching attempt (see docs/matching-engine.md) at this radius.
      - Success: mark the queue "assigned", return the updated trip request.
      - NoDriversAvailableError and more tiers remain: loop to the next tier.
      - NoDriversAvailableError and no more tiers: rethrow (queue already
        marked exhausted by the loop's own check on the next iteration).
```

Because `handleOfferNotAccepted()` (a decline or expiry) calls
`dispatch()` again on the *same* trip request, a declined/expired offer
resumes the search from wherever the queue's `expansionAttempt` currently
is — it does not restart from the smallest radius. Radius expansion and
offer reassignment are independent axes: expansion widens *who's
considered*, reassignment moves on to the *next candidate* within
whatever's currently considered.

## Passenger-app UI (Part 9)

`apps/passenger-app/src/app/booking/searching.tsx` reflects this as a
`SearchPhase` state machine: searching → driver found → driver accepted,
or searching again (after a decline/expiry) → no driver found (after
exhaustion), with retry/cancel actions. See docs/ride-request.md for the
rest of the booking flow this screen sits inside.

## Related Docs

- [Matching Engine](./matching-engine.md)
- [Ride Offers](./ride-offers.md)
- [Dispatch Center](./dispatch-center.md)
