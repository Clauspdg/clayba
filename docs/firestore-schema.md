# Firestore Schema (Sprint 1)

All 20 collections requested for Sprint 1, plus `passengers` (+ two
subcollections) — added because Part 6 ("Passenger Domain") asks for a
passenger profile distinct from the generic `users` record, matching the
`drivers`/`users` split and the collection this repo's own
[docs/database/DATABASE.md](./database/DATABASE.md) planning table already
anticipated.

Every shape below is a Zod schema in `packages/types/src/<domain>` — that
file is the actual source of truth; this page is a human-readable summary.
Every collection is read/written exclusively through a repository in
`packages/firebase/src/firestore/<domain>.repository.ts` (see
[architecture-sprint1.md](./architecture-sprint1.md)).

## authentication

### users

Source: `packages/types/src/authentication/authentication.schemas.ts` (`userSchema`)

| Field | Type | Notes |
| --- | --- | --- |
| id | string | Firestore document ID |
| email | string | |
| phoneNumber | string? | |
| displayName | string? | |
| role | Role | Mirrored into Firebase Auth custom claims — see [authentication.md](./authentication.md) |
| status | UserStatus | active / suspended / deleted |
| createdAt | Date | |
| updatedAt | Date | |

### auditLogs

Source: `authentication.schemas.ts` (`auditLogSchema`) — write-only via `AuditLogsRepository.record()`, see [security.md](./security.md).

| Field | Type | Notes |
| --- | --- | --- |
| id | string | |
| action | AuditAction | Centralized list in `authentication.enums.ts` |
| actorId | string | Who performed the action |
| actorRole | Role | |
| targetId | string? | What was acted on |
| targetType | string? | e.g. `"driver"`, `"payment"` |
| reason | string? | |
| metadata | Record<string, unknown>? | |
| createdAt | Date | |

Indexes: `(targetId asc, createdAt desc)`, `(actorId asc, createdAt desc)` — see `firestore.indexes.json`.

## drivers

### driverApplications

Source: `packages/types/src/drivers/drivers.schemas.ts` (`driverApplicationSchema`)

| Field | Type | Notes |
| --- | --- | --- |
| id | string | |
| userId | string | |
| status | DriverApplicationStatus | See [driver-management.md](./driver-management.md) for the full pipeline |
| submittedAt | Date? | |
| reviewedBy | string? | |
| rejectionReason | string? | |
| createdAt | Date | |
| updatedAt | Date | |

Indexes: `(status asc, createdAt asc)` — admin review queue, oldest first.

### drivers

Source: `drivers.schemas.ts` (`driverSchema`) — created on application activation.

| Field | Type | Notes |
| --- | --- | --- |
| id | string | |
| userId | string | |
| applicationId | string | |
| status | DriverAccountStatus | active / suspended / terminated |
| vehicleId | string? | |
| documents | DriverDocument[] | type/url/expiresAt/verifiedAt |
| rating | number | 0-5, default 0 |
| completedTrips | number | default 0 |
| warningsCount | number | default 0 |
| score | number | 0-100, default 100 — see `calculateDriverScore` |
| createdAt | Date | |
| updatedAt | Date | |

### driverWarnings

| Field | Type | Notes |
| --- | --- | --- |
| id | string | |
| driverId | string | |
| reason | string | |
| issuedBy | string | |
| createdAt | Date | |

Indexes: `(driverId asc, createdAt desc)`.

### driverSuspensions

| Field | Type | Notes |
| --- | --- | --- |
| id | string | |
| driverId | string | |
| reason | string | |
| suspendedBy | string | |
| startAt | Date | |
| endAt | Date? | |
| liftedAt | Date? | |
| liftedBy | string? | |
| createdAt | Date | |

## fleet-management

### vehicles

Source: `packages/types/src/fleet-management/fleet-management.schemas.ts`

| Field | Type | Notes |
| --- | --- | --- |
| id | string | |
| driverId | string | |
| make / model / year / plateNumber / color | string / string / number / string / string | |
| status | VehicleStatus | pending / approved / rejected / active / inactive |
| inspectionExpiresAt | Date? | |
| createdAt / updatedAt | Date | |

## passengers

### passengers

Source: `packages/types/src/passengers/passengers.schemas.ts`

| Field | Type | Notes |
| --- | --- | --- |
| id | string | |
| userId | string | |
| defaultPaymentMethodId | string? | |
| homeAddress / workAddress | string? | |
| preferences | PassengerPreferences | language, notificationsEnabled, smsEnabled, quietRideDefault |
| createdAt / updatedAt | Date | |

### passengers/{passengerId}/favoritePlaces

| Field | Type | Notes |
| --- | --- | --- |
| id, passengerId | string | |
| label, address | string | |
| lat, lng | number | |
| createdAt | Date | |

### passengers/{passengerId}/paymentPreferences

| Field | Type | Notes |
| --- | --- | --- |
| id, passengerId | string | |
| provider | card / wallet | |
| isDefault | boolean | |
| createdAt | Date | |

Note: "ride history" is intentionally **not** its own collection — it's a
query (`TripsRepository.listForPassenger(passengerId)`) over `trips`, per
the "denormalization over joins, not duplication" convention in
[docs/database/DATABASE.md](./database/DATABASE.md).

## trips

Trip matching/dispatch business logic is out of scope for Sprint 1 — these
are data shapes only.

### trips

| Field | Type | Notes |
| --- | --- | --- |
| id | string | |
| passengerId | string | |
| driverId / vehicleId | string? | |
| status | TripStatus | requested → matched → en_route_to_pickup → arrived → in_progress → completed / cancelled |
| pickup / dropoff | GeoLocation | `{ lat, lng, address? }` |
| requestedAt | Date | |
| startedAt / completedAt / cancelledAt | Date? | |
| fareAmount | number? | |
| createdAt / updatedAt | Date | |

### tripRequests

| Field | Type | Notes |
| --- | --- | --- |
| id, passengerId | string | |
| status | TripRequestStatus | |
| pickup / dropoff | GeoLocation | |
| requestedAt / expiresAt | Date | |
| createdAt | Date | |

### ratings

| Field | Type | Notes |
| --- | --- | --- |
| id, tripId, raterId, rateeId | string | |
| score | number | 1-5 |
| comment | string? | |
| createdAt | Date | |

### reviews

| Field | Type | Notes |
| --- | --- | --- |
| id, tripId, authorId, targetId | string | |
| content | string | |
| isModerated | boolean | default false |
| createdAt | Date | |

## payments

### payments

Payment processing/capture is out of scope for Sprint 1 — data shape and status lifecycle only.

| Field | Type | Notes |
| --- | --- | --- |
| id, tripId, payerId | string | |
| amount | number | |
| currency | string | 3-letter code, default `USD` |
| method | PaymentMethodType | card / wallet / cash |
| status | PaymentStatus | pending → authorized → captured / failed / refunded |
| refundedAmount | number? | |
| createdAt / updatedAt | Date | |

## wallet

### wallets

| Field | Type | Notes |
| --- | --- | --- |
| id, ownerId | string | |
| ownerType | passenger / driver | |
| balance | number | |
| currency | string | |
| createdAt / updatedAt | Date | |

### transactions

| Field | Type | Notes |
| --- | --- | --- |
| id, walletId | string | |
| type | TransactionType | credit / debit / payout / adjustment / commission |
| amount, currency | number, string | |
| referenceId / description | string? | |
| createdAt | Date | |

### commissions

| Field | Type | Notes |
| --- | --- | --- |
| id, tripId, driverId | string | |
| rate | number | 0-1 |
| amount, currency | number, string | |
| createdAt | Date | |

## reports

### reports

| Field | Type | Notes |
| --- | --- | --- |
| id, reporterId, targetId | string | |
| targetType | string | e.g. `"driver"`, `"trip"` |
| category | ReportCategory | safety / harassment / payment / vehicle / other |
| status | ReportStatus | open → under_review → resolved / dismissed |
| description | string | |
| resolvedBy / resolution | string? | |
| createdAt / updatedAt | Date | |

## support

### supportTickets

| Field | Type | Notes |
| --- | --- | --- |
| id, requesterId | string | |
| subject, description | string | |
| status | SupportTicketStatus | open → assigned → in_progress → resolved / closed |
| priority | SupportTicketPriority | low / medium / high / urgent |
| assignedTo | string? | |
| createdAt / updatedAt | Date | |

Indexes: `(status asc, createdAt asc)` — support queue, oldest first.

## settings

### settings

Singleton document, id `"global"`.

| Field | Type | Notes |
| --- | --- | --- |
| id | string | Always `"global"` — see `GLOBAL_SETTINGS_DOC_ID` |
| commissionRate | number | 0-1 |
| supportEmail | string | |
| maintenanceMode | boolean | |
| featureFlags | Record<string, boolean> | |
| updatedBy | string | |
| updatedAt | Date | |

## emergency

### emergencyContacts

| Field | Type | Notes |
| --- | --- | --- |
| id, userId | string | |
| name, phoneNumber | string | |
| relationship | string? | |
| createdAt / updatedAt | Date | |

## notifications

### notifications

| Field | Type | Notes |
| --- | --- | --- |
| id, userId | string | |
| type | NotificationType | trip_update / payment / promotion / system / safety |
| title, body | string | |
| isRead | boolean | default false |
| data | Record<string, unknown>? | |
| createdAt | Date | |

## Related Docs

- [Security](./security.md)
- [Driver Management](./driver-management.md)
- [Architecture (Sprint 1)](./architecture-sprint1.md)
- [docs/database/DATABASE.md](./database/DATABASE.md) (naming conventions)
