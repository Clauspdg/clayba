# Matching Engine (Sprint 4)

Replaces Sprint 3's simple `dispatch.ts` ranking (score + ETA tiebreak)
with an eligibility filter followed by a configurable weighted scoring
model. Still no sockets, no live tracking — one matching attempt runs
synchronously per call.

## Split: pure algorithm vs. orchestration

Same pattern as Sprint 3's dispatch engine (see docs/dispatch-engine.md):

- **Pure algorithm** — `packages/utils/src/trips/matching.ts`. Takes a flat
  `MatchingCandidate[]` and `MatchingCriteria`, returns ranked results.
  Zero Firestore dependency, fully unit-tested
  (`packages/utils/src/trips/matching.test.ts`).
- **Orchestration** — `packages/firebase/src/firestore/dispatch.service.ts`'s
  `DispatchService`. Assembles `MatchingCandidate[]` from
  `DriversRepository`/`VehiclesRepository`/`DriverPresenceRepository`,
  reads weights/thresholds from `SettingsRepository`, and drives the
  ride-offer lifecycle (see docs/ride-offers.md) and search-radius
  expansion (see docs/search-expansion.md).

## Eligibility filters (Part 3)

A candidate must pass **all eleven** checks
(`isMatchingCandidateEligible` in `matching.ts`):

| # | Check | Source |
| --- | --- | --- |
| 1 | Verified | `Driver.status === DriverAccountStatus.ACTIVE` |
| 2 | Approved (implied by verified) | `DriverAccountStatus.ACTIVE` |
| 3 | Vehicle approved | `Vehicle.status === VehicleStatus.APPROVED` |
| 4 | Documents valid | none of `Driver.documents[]` expired (`getDocumentExpirationStatus`) |
| 5 | Online | `availabilityStatus !== OFFLINE` (implied by check 6) |
| 6 | Available | `availabilityStatus === DriverAvailabilityStatus.AVAILABLE` |
| 7 | Within search radius | haversine distance from driver location to pickup <= current radius tier |
| 8 | Not suspended | `!candidate.isSuspended` |
| 9 | Minimum driver score | `candidate.score >= criteria.minDriverScore` |
| 10 | Minimum acceptance rate | `candidate.acceptanceRate >= criteria.minAcceptanceRate` |
| 11 | Maximum cancellation rate / active jobs | `candidate.cancellationRate <= criteria.maxCancellationRate` and `candidate.activeJobsCount < criteria.maxActiveJobsPerDriver` |

`DispatchService.buildMatchingCandidates()` also excludes any driver
already offered this trip request in the current search cycle
(`DispatchQueue.offeredDriverIds`), so a decline/expiry never re-offers
the same driver.

## Scoring formula (Part 4)

`calculateMatchingScore()` normalizes nine components to 0-1, applies a
configurable weight to each (`PlatformSettings.matchingWeights`), and
divides by the sum of weights actually used — so weights don't need to
sum to exactly 1:

```
total = Σ(component_i × weight_i) / Σ(weight_i)
```

| Component | Default weight | Normalization |
| --- | --- | --- |
| `distance` | 0.3 | `1 - distanceMeters / searchRadiusMeters`, clamped 0-1 |
| `eta` | 0.2 | `1 - etaSeconds / etaAtMaxRadius`, clamped 0-1 |
| `rating` | 0.15 | `rating / 5` |
| `acceptanceRate` | 0.1 | used as-is (already 0-1) |
| `completionRate` | 0.1 | `1 - cancellationRate` (no separate completed-ride rate is tracked on `Driver`; cancellation rate's inverse is the proxy) |
| `recentActivity` | 0.05 | `1 - secondsSinceLastHeartbeat / 300`, clamped 0-1 (stale after 5 minutes) |
| `driverLevel` | 0.05 | tenure tier from `getDriverLevel(completedTrips)`, normalized new=0 … platinum=1 |
| `vehicleCategoryMatch` | 0.025 | 1 if driver's vehicle category matches the request, 0 if it doesn't, 0.5 if either side is unset |
| `serviceZone` | 0.025 | proxy score — see below |

### Why `completionRate` reuses `cancellationRate`

No dedicated "completed ride rate" field exists on `Driver`; adding one
would duplicate `cancellationRate`'s information for a V1 scoring input.
`1 - cancellationRate` is used as the signal instead.

### `serviceZone` proxy

No real geofencing/zone subsystem exists yet (out of scope this sprint).
`getServiceZoneScore()` scores a driver higher the closer they are to the
*smallest* configured search-radius tier (`SEARCH_RADIUS_EXPANSION_KM`,
2 km), treating that innermost ring as the pickup's "home zone" — a
placeholder until real service zones ship.

## Ranking

`rankMatchingCandidates()` filters to eligible candidates, scores each,
and sorts highest-`total`-first. `DispatchService.runMatchingAttempt()`
takes only the top candidate — Sprint 4 offers one driver at a time (see
docs/ride-offers.md for why sequential offers, not a broadcast batch).

## Matching log (Part 11)

Every `runMatchingAttempt()` call writes one `MatchingLog` document
(`matchingLogs` collection): how many candidates were evaluated, how many
were eligible, and the top 5 candidates' scores/breakdowns — a
debugging/tuning trail for operators adjusting `matchingWeights`, not a
compliance record (that's `dispatchEvents` / `auditLogs`).

## Related Docs

- [Dispatch Center](./dispatch-center.md)
- [Driver Presence](./driver-presence.md)
- [Ride Offers](./ride-offers.md)
- [Search Radius Expansion](./search-expansion.md)
- [Dispatch Engine (V1, Sprint 3)](./dispatch-engine.md)
