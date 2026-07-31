# Driver Presence & Availability (Sprint 4, Parts 1-2)

Tracks a driver's real-time shift/presence status, separately from the
account-standing status (`DriverAccountStatus`) an admin controls.

## Two statuses, kept in sync one direction only

| | `DriverAccountStatus` | `DriverAvailabilityStatus` |
| --- | --- | --- |
| Who changes it | Admin action (`DriversRepository.suspend()`/`reactivate()`/`terminate()`) | The driver, shift-to-shift (`DriversRepository.setAvailabilityStatus()`) |
| What it means | Is this driver's account in good standing? | Is this driver on shift right now, and can they take a ride? |
| Values | `active`, `suspended`, `terminated` | see below |

Suspending the account forces availability to `SUSPENDED` too. Going
offline for the night never touches the account status — the two are
independent except for that one enforced direction.

## Availability states (Part 1)

```ts
enum DriverAvailabilityStatus {
  OFFLINE, ONLINE, AVAILABLE, BUSY, ON_TRIP, ON_BREAK, SUSPENDED, INACTIVE
}
```

| State | Meaning |
| --- | --- |
| `OFFLINE` | App closed / not on shift |
| `ONLINE` | App open, driver has not marked themselves ready for rides |
| `AVAILABLE` | Ready to receive ride offers — the only state the matching engine considers eligible |
| `BUSY` | An offer is pending response (set the moment an offer is sent) |
| `ON_TRIP` | Offer accepted, actively driving a passenger |
| `ON_BREAK` | Online but temporarily not accepting offers |
| `SUSPENDED` | Account suspended — mirrors `DriverAccountStatus.SUSPENDED` |
| `INACTIVE` | Long-idle/deactivated shift state |

## Transition rules

Enforced by `packages/utils/src/drivers/availability.ts`
(`assertAvailabilityTransition`), driven by
`DRIVER_AVAILABILITY_TRANSITIONS` in
`packages/types/src/drivers/drivers.constants.ts` — the same
enum-plus-transition-map pattern as every other lifecycle in this project
(driver applications, trip requests, ride offers).

```
OFFLINE    -> ONLINE, INACTIVE
ONLINE     -> AVAILABLE, OFFLINE
AVAILABLE  -> BUSY, ON_BREAK, OFFLINE, SUSPENDED
BUSY       -> ON_TRIP, AVAILABLE, SUSPENDED
ON_TRIP    -> AVAILABLE, SUSPENDED
ON_BREAK   -> AVAILABLE, OFFLINE, SUSPENDED
SUSPENDED  -> OFFLINE
INACTIVE   -> OFFLINE
```

`isAvailableForOffers(status)` is the single predicate the matching
engine's eligibility filter calls — currently true only for `AVAILABLE`.

## `DriverPresence` (Part 2)

A separate `driverPresence` collection (document id === `driverId`),
not fields on `Driver` — presence changes on every heartbeat, and
splitting it out avoids rewriting the (larger, less frequently written)
`Driver` document on every ping.

```ts
{
  id: string;              // === driverId
  driverId: string;
  status: DriverAvailabilityStatus;
  availabilityReason?: string;
  currentRideId?: string;  // set while BUSY (offer pending) or ON_TRIP
  lastHeartbeatAt: Date;
  lastSeenAt: Date;
  onlineSince?: Date;      // cleared when status returns to OFFLINE; used for online-duration
  devices: Record<string, DriverDevice>; // keyed by deviceId — multi-device support
  updatedAt: Date;
}
```

### Multi-device safety

`DriverPresenceRepository.heartbeat(driverId, deviceId, platform)` upserts
only the calling device's entry in `devices`, leaving every other device
the same driver is signed in on untouched — so a driver signed in on two
phones doesn't have one device's heartbeat clobber the other's.

### `DriverPresenceRepository.setStatus()` vs. `DriversRepository.setAvailabilityStatus()`

- `DriverPresenceRepository.setStatus()` writes `status`/`availabilityReason`/
  `currentRideId` and maintains `onlineSince`, but does **not** validate the
  transition.
- `DriversRepository.setAvailabilityStatus()` is the public entry point:
  it calls `assertAvailabilityTransition()` first, then updates both the
  `Driver` document (`availabilityStatus`, plus the deprecated
  `isOnline`/`isAvailable` booleans for one-way backward compatibility)
  and delegates to `DriverPresenceRepository.setStatus()`.

Callers (the driver app, `DispatchService`) always go through
`DriversRepository.setAvailabilityStatus()` — never
`DriverPresenceRepository.setStatus()` directly.

## Related Docs

- [Matching Engine](./matching-engine.md)
- [Ride Offers](./ride-offers.md)
- [Driver Management](./driver-management.md)
