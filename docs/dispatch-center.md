# Admin Dispatch Center (Sprint 4, Part 10)

`apps/admin`'s operational view into the matching engine: one page, six
tabs, route `/dispatch-center`
(`apps/admin/src/app/(dashboard)/dispatch-center/page.tsx` →
`apps/admin/src/features/trips/DispatchCenterPage.tsx`).

## Why tabs, not six sidebar items

`Sidebar` (`packages/ui`) has no section/grouping support, and adding six
flat entries under "Trips" would bloat the nav for what is really one
feature with six views. Radix `Tabs` (already used elsewhere in the admin
app) keeps it to a single sidebar entry
(`admin.sidebar.dispatchCenter`, `/dispatch-center`, `monitor` icon) with
tab-scoped content underneath — the same reasoning that led Sprint 3 to
avoid adding new sidebar depth.

## Tabs

| Tab | Component | Shows |
| --- | --- | --- |
| Live Ride Requests | `LiveRideRequestsTab` | Trip requests currently in `SEARCHING_DRIVER`/`DRIVER_ASSIGNED`, with live counters |
| Driver Queue | `DriverQueueTab` | Drivers currently `AVAILABLE`/`BUSY`/`ON_TRIP`, positioned for dispatch |
| Offer History | `OfferHistoryTab` | Recent `RideOffer` documents and their terminal status (`admin.offerStatus.*` labels) |
| Dispatch Statistics | `DispatchStatisticsTab` | Aggregate counters — offers sent/accepted/declined/expired, average time-to-match |
| Search Radius Settings | `SearchRadiusTab` | The `SEARCH_RADIUS_EXPANSION_KM` tiers (read-only display of the configured expansion sequence) |
| Assignment Settings | `AssignmentSettingsTab` | `PlatformSettings` matching thresholds: offer timeout, max driver offers, min driver score, min acceptance rate, max cancellation rate, max active jobs |

## Scope note (same placeholder-auth pattern as every Sprint 3/4 admin page)

No live Firestore session is wired into the admin dashboard yet (see
`VehicleCategoriesPage`'s scope note, Sprint 3) — these tabs render
illustrative sample data shaped like the real `RideOffer`/`DispatchQueue`/
`DriverPresence` documents, not live queries. Wiring the dashboard to a
real authenticated session and live Firestore listeners is a later
sprint's job; this sprint's contract is the UI shape, the data model, and
the service layer (`DispatchService`) it will eventually read from.

## Audit logging (Part 12)

Every assignment event — offer sent, viewed, accepted, declined, expired,
cancelled, driver reassigned, radius expanded, no drivers found — is
recorded by `DispatchEventsRepository` into the `dispatchEvents`
collection (see `DISPATCH_EVENT_TYPES` in
`packages/types/src/trips/trips.enums.ts`), called from every relevant
`DispatchService` method (`runMatchingAttempt`, `dispatch`,
`handleOfferAccepted`, `handleOfferNotAccepted`).

`dispatchEvents` is intentionally **separate** from the `authentication`
domain's `AuditLog`/`auditLogs` collection (Sprint 1): `auditLogs` is the
compliance-grade trail for admin-triggered actions (who did what, when);
`dispatchEvents` is a high-frequency, system-generated operational log of
the matching engine's own decisions. Mixing the two would make
`auditLogs` noisy without adding compliance value, and would make
`dispatchEvents` slower to query if it inherited `auditLogs`'s
broader-purpose indexing. The Offer History tab reads from
`dispatchEvents`/`rideOffers`, not `auditLogs`.

## Related Docs

- [Matching Engine](./matching-engine.md)
- [Driver Presence](./driver-presence.md)
- [Ride Offers](./ride-offers.md)
- [Search Radius Expansion](./search-expansion.md)
- [Dispatch Engine (V1, Sprint 3)](./dispatch-engine.md)
