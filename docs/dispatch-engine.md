# Dispatch Engine (V1)

Sprint 3, Part 6. Finds and assigns a driver to a `tripRequest`. No
sockets, no live tracking — this runs once per dispatch attempt (a
scheduled Cloud Function trigger calling it is a later sprint's job).

## Split: pure algorithm vs. orchestration

Following the pattern from Sprint 1 (RBAC resolution vs. guards; workflow
state machine vs. repository methods):

- **Pure algorithm** — `packages/utils/src/trips/dispatch.ts`. Takes a
  flat `DispatchCandidate[]` and criteria, returns ranked results. Zero
  Firestore/network dependency, fully unit-tested
  (`packages/utils/src/trips/dispatch.test.ts`).
- **Orchestration** — `packages/firebase/src/firestore/dispatch.service.ts`'s
  `DispatchService`. Assembles `DispatchCandidate[]` from
  `DriversRepository`/`VehiclesRepository`, reads config from
  `SettingsRepository`, and writes the result via `TripRequestsRepository`.

## Eligibility (Part 6)

A candidate driver must pass **all seven** checks
(`isDriverEligible` in `dispatch.ts`):

| Check | Source |
| --- | --- |
| Online | `Driver.isOnline` |
| Available | `Driver.isAvailable` |
| Verified | `Driver.status === DriverAccountStatus.ACTIVE` |
| Not suspended | `Driver.status !== DriverAccountStatus.SUSPENDED` |
| Documents valid | none of `Driver.documents[]` are expired (`@the-ride/utils`'s `getDocumentExpirationStatus`) |
| Vehicle approved | the driver's `Vehicle.status === VehicleStatus.APPROVED` |
| Within search radius | haversine distance from `Driver.lastKnownLocation` to pickup <= `PlatformSettings.searchRadiusKm` |

## Ranking

Eligible drivers are sorted **highest `score` first**, ties broken by
**closest ETA** (`rankEligibleDrivers`). `selectDriverOffers` then caps the
list at `PlatformSettings.maxDriverOffers`.

### Why haversine instead of a live routing call for ranking

Calling the map provider's `getRoute()` once per candidate driver to rank
them would mean N external API calls per dispatch attempt. V1 uses
`haversineDistanceMeters` + a flat-speed `estimateEtaSeconds`
(`packages/utils/src/trips/distance.ts`) as the ranking proxy — cheap,
provider-independent, and good enough to order a handful of nearby
candidates. The passenger-facing fare/ETA estimate (shown before booking)
still prefers a real `getRoute()` call when a map provider is configured,
falling back to the same haversine estimate otherwise — see
docs/maps.md.

## `DispatchService.dispatch(tripRequestId)`

```
1. Load the trip request; read PlatformSettings (search radius, max offers, assignment timeout).
2. Build DispatchCandidate[] from Active drivers who are online, available, and have a known location
   (an in-memory filter, not a Firestore composite-index query — see the code comment for why).
3. rankEligibleDrivers + selectDriverOffers -> ranked offer list.
4. If empty: throw NoDriversAvailableError (caller decides retry vs. expire).
5. TripRequestsRepository.startSearching(id, offeredDriverIds) — records the full offer list.
6. TripRequestsRepository.assignDriver(id, topOffer.driverId, now + assignmentTimeoutSeconds) — assigns the top candidate.
```

Driver acceptance/rejection (`driverAccept`/`driverReject`) and re-offering
after a rejection are `TripRequestsRepository` methods a Cloud Function
would call in response to the driver app's response — building that
trigger is a later sprint (this sprint has no sockets/push).

## Configuration (Part 7)

All read from `PlatformSettings` (`packages/types/src/settings`), editable
from the admin dashboard's Dispatch Settings page:

| Setting | Field | Default |
| --- | --- | --- |
| Search radius | `searchRadiusKm` | 5 |
| Assignment timeout | `assignmentTimeoutSeconds` | 15 |
| Maximum driver offers | `maxDriverOffers` | 3 |

## Related Docs

- [Ride Request](./ride-request.md)
- [Pricing Engine](./pricing-engine.md)
- [Vehicle Categories](./vehicle-categories.md)
