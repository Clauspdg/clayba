# Database

The Ride uses **Cloud Firestore** as its primary datastore, with **Cloud
Storage** for binary assets (documents, photos, receipts) and **BigQuery**
(via Firestore export) planned for analytics/reporting at scale.

> Sprint 1 implemented the collections listed below — see
> [firestore.rules](../../firestore.rules), which now enforces RBAC per
> collection instead of denying all access.

## Conventions

- **Collection naming**: plural, camelCase, one top-level collection per
  domain aggregate (e.g. `trips`, `drivers`, `driverApplications`),
  matching the domain folders in `packages/types/src/<domain>`.
- **Document shape source of truth**: every collection's document shape
  is defined once as a Zod schema in `packages/types/src/<domain>` and
  converted via a Firestore `FirestoreDataConverter` in
  `packages/firebase/src/firestore`, never hand-typed at each call site.
- **Denormalization over joins**: Firestore has no joins; fields that are
  read together should be co-located or duplicated with an explicit
  sync strategy (Cloud Function trigger) documented per collection.
- **Subcollections vs. top-level**: prefer subcollections only when data
  is always accessed in the context of its parent (e.g.
  `trips/{tripId}/locationUpdates`); use top-level collections with a
  foreign-key-style field when cross-domain queries are needed.
- **Security rules live per domain**: as each domain is implemented,
  its rules should be added to `firestore.rules` (and `storage.rules`
  for binary assets) with tests, replacing the current deny-all default.
- **Indexes**: composite indexes go in `firestore.indexes.json`, kept in
  sync with the queries each domain's `packages/api/src/<domain>` hooks
  actually issue.

## Collections

Finalized in Sprint 1 for the domains below — see
[../firestore-schema.md](../firestore-schema.md) for full field-level detail
per collection. Domains not yet touched (`messaging`, `analytics`, `maps`)
remain placeholders.

| Domain | Collection(s) |
| --- | --- |
| authentication | `users`, `auditLogs` |
| passengers | `passengers`, `passengers/{id}/favoritePlaces`, `passengers/{id}/paymentPreferences` |
| drivers | `driverApplications`, `drivers`, `driverWarnings`, `driverSuspensions` |
| fleet-management | `vehicles` |
| trips | `trips`, `tripRequests`, `ratings`, `reviews` |
| payments | `payments` |
| wallet | `wallets`, `commissions`, `transactions` |
| support | `supportTickets` |
| reports | `reports` |
| emergency | `emergencyContacts` |
| notifications | `notifications` |
| settings | `settings` |
| messaging (placeholder) | `conversations`, `conversations/{id}/messages` |
| analytics (placeholder) | derived/aggregated collections or BigQuery export |

## Storage Buckets (paths — placeholder)

| Path prefix | Purpose |
| --- | --- |
| `driver-documents/{driverId}/` | License, insurance, background check docs |
| `vehicle-photos/{vehicleId}/` | Fleet vehicle photos |
| `avatars/{userId}/` | Passenger/driver profile photos |
| `trip-receipts/{tripId}/` | Generated receipt PDFs |
| `support-attachments/{ticketId}/` | Support ticket file uploads |

## Related Docs

- [Architecture](../architecture/ARCHITECTURE.md)
- [firestore.rules](../../firestore.rules) / [storage.rules](../../storage.rules)
