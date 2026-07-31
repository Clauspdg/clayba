# Pricing Engine

`packages/utils/src/trips/pricing.ts` — `calculateFare()`. Pure function,
no Firestore/network access, so the passenger app, the admin dashboard,
and (in a later sprint) the dispatch/settlement path can all compute the
same estimate the same way.

## Inputs

```ts
calculateFare({
  distanceMeters: number,
  durationSeconds: number,
  category: { baseFare, perKmRate, perMinuteRate, minimumFare },   // from a VehicleCategory
  settings: {
    bookingFee, serviceFeeRate, commissionRate,                    // from PlatformSettings
    taxRate?, surgeMultiplier?, discount?, promoCodeDiscount?,      // placeholders, default to inert values
    currency?,
  },
})
```

## Formula

```
meteredFare      = (baseFare + distanceFare + timeFare) × surgeMultiplier
fareAfterMinimum = max(meteredFare, category.minimumFare)

subtotal         = fareAfterMinimum + bookingFee + serviceFee
serviceFee       = fareAfterMinimum × serviceFeeRate

afterDiscounts   = max(0, subtotal − discount − promoCodeDiscount)
tax              = afterDiscounts × taxRate
total            = afterDiscounts + tax

commission       = fareAfterMinimum × commissionRate     // informational only, not subtracted from total
```

Where:

```
distanceFare = (distanceMeters / 1000) × category.perKmRate
timeFare     = (durationSeconds / 60) × category.perMinuteRate
```

## Placeholders (Part 4)

`surgeMultiplier`, `discount`, `promoCodeDiscount`, and `taxRate` are all
accepted by `calculateFare` and flow through the real formula above, but
every caller in this sprint passes their inert values (`1`, `0`, `0`, `0`)
— there's no surge-pricing engine, discount engine, promo-code system, or
tax-rules engine yet. The formula is already shaped to support them
without a rewrite once those ship.

## Worked example

Economy category (`packages/types/src/settings/settings.constants.ts`,
`DEFAULT_VEHICLE_CATEGORIES`): `baseFare: 2.5`, `perKmRate: 1.1`,
`perMinuteRate: 0.18`, `minimumFare: 5`. A 5 km, 10-minute trip, default
settings (`bookingFee: 0`, `serviceFeeRate: 0`, `commissionRate: 0.2`):

| Line | Value |
| --- | --- |
| Base fare | $2.50 |
| Distance fare (5 km × $1.10) | $5.50 |
| Time fare (10 min × $0.18) | $1.80 |
| Metered fare (sum, surge ×1) | $9.80 |
| Fare after minimum (above $5 minimum, unchanged) | $9.80 |
| Booking fee | $0.00 |
| Service fee (0%) | $0.00 |
| **Subtotal** | **$9.80** |
| Discount / promo / tax (all placeholders) | $0.00 |
| **Total** | **$9.80** |
| Commission (20% of $9.80, informational) | $1.96 |

A very short trip (0.1 km, 30s) falls below the $5 minimum, so
`fareAfterMinimum` becomes `5.00` instead of the tiny metered amount —
see `packages/utils/src/trips/pricing.test.ts` for this exact case.

## Output shape

`FareBreakdown` (`packages/types/src/trips/trips.schemas.ts`) — every line
above, plus `currency`. This is what `TripRequest.fareEstimate` stores and
what `AppFareBreakdown` (passenger app) renders itemized.

## Related Docs

- [Ride Request](./ride-request.md)
- [Vehicle Categories](./vehicle-categories.md)
- [Dispatch Engine](./dispatch-engine.md)
