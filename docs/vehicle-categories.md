# Vehicle Categories

Sprint 3, Part 3. Admin-configurable ride tiers — data in Firestore, not a
fixed TypeScript enum, so operators can add/edit/retire categories without
a deploy.

## Shape

`VehicleCategory` (`packages/types/src/settings/settings.schemas.ts`):

| Field | Type | Notes |
| --- | --- | --- |
| id | string | |
| name | string | |
| description | string? | |
| icon | string | `@the-ride/ui` icon registry key (`packages/ui/src/tokens/icons.ts`) |
| color | string | Hex, used for badges and map markers |
| baseFare | number | |
| perKmRate | number | |
| perMinuteRate | number | |
| minimumFare | number | |
| maximumPassengers | number | |
| isActive | boolean | default `true` |
| sortOrder | number | default `0` — display order |
| createdAt / updatedAt | Date | |

`baseFare`/`perKmRate`/`perMinuteRate`/`minimumFare` feed directly into
the pricing engine (see docs/pricing-engine.md) — there's no separate
"fare config per category" concept, it all lives on the category record
itself.

## Starter categories

`DEFAULT_VEHICLE_CATEGORIES` (`packages/types/src/settings/settings.constants.ts`)
seeds six categories on a fresh environment:

| Category | Base fare | Per km | Per minute | Minimum | Max passengers |
| --- | --- | --- | --- | --- | --- |
| Economy | $2.50 | $1.10 | $0.18 | $5.00 | 4 |
| Comfort | $3.50 | $1.35 | $0.22 | $7.00 | 4 |
| XL | $4.50 | $1.60 | $0.28 | $9.00 | 6 |
| Luxury | $8.00 | $2.40 | $0.40 | $15.00 | 4 |
| Business | $7.00 | $2.10 | $0.35 | $13.00 | 4 |
| Accessible | $3.00 | $1.20 | $0.20 | $6.00 | 4 |

## Firestore

Collection `vehicleCategories`
(`VehicleCategoriesRepository`, `packages/firebase/src/firestore/settings.repository.ts`):

- `listActive()` — active categories, sorted by `sortOrder`, for the
  passenger app's Vehicle Selection screen.
- `createCategory()` / `updateCategory()` — audited (`settings.updated`,
  `targetType: "vehicleCategory"`).
- `seedDefaults()` — writes `DEFAULT_VEHICLE_CATEGORIES` for any category
  id that doesn't already exist; no-op otherwise.

Security rules (`firestore.rules`): publicly readable (the booking flow
needs to list ride tiers before a rider is signed in), admin-only write.

## Admin dashboard

`/vehicle-categories` — read-only table over `DEFAULT_VEHICLE_CATEGORIES`
(see the scope note in docs/ride-request.md: no live Firestore session is
wired into the dashboard yet, so this is real UI over real seed data
rather than a live-editable table).

## Related Docs

- [Pricing Engine](./pricing-engine.md)
- [Ride Request](./ride-request.md)
- [Dispatch Engine](./dispatch-engine.md)
