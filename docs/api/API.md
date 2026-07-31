# API

The Ride's API surface is split across two transport mechanisms:

1. **Next.js Route Handlers** (`apps/web/src/app/api`,
   `apps/admin/src/app/api`) — for server-side operations tied to a
   specific web/admin request (webhooks, SSR data fetching helpers).
2. **Firebase Cloud Functions** (`functions/src/<domain>`) — for
   privileged, backend-owned operations shared by every client (mobile
   apps included): payment processing, trip matching, notification
   fan-out, scheduled jobs.

Client apps never call either surface directly by hand — they go through
generated hooks in `packages/api/src/<domain>`, which wrap
`@tanstack/react-query` and validate responses against the Zod schemas in
`packages/types/src/<domain>`.

> No endpoints or functions are implemented yet. This document defines
> the conventions new endpoints must follow.

## Conventions

- **Request/response contracts are Zod schemas**, defined once in
  `packages/types/src/<domain>` and imported by both the
  implementation (Route Handler or Cloud Function) and the client hook —
  never duplicated.
- **Authentication**: every non-public endpoint verifies a Firebase ID
  token (via `packages/firebase/src/admin`) before executing; role checks
  (passenger/driver/admin/support) happen immediately after.
- **Versioning**: breaking changes to a domain's contract require a new
  schema version and a deprecation window; Cloud Functions are versioned
  by name (`tripsCreateV2`) rather than URL path where callable functions
  are used.
- **Error shape**: all endpoints return a consistent error envelope
  (`{ error: { code, message } }`) — to be defined in
  `packages/types/src/settings` or a shared `packages/types/src/common`
  module once implemented.
- **Idempotency**: mutating endpoints that can be retried by a client
  (payments, trip creation) must accept an idempotency key.

## Domains

| Domain | Client entry point | Backend implementation |
| --- | --- | --- |
| authentication | `packages/api/src/authentication` | Firebase Auth + `functions/src/authentication` |
| payments | `packages/api/src/payments` | `functions/src/payments` (Stripe webhooks) |
| maps | `packages/api/src/maps` | Google Maps Platform (client + server keys) |
| notifications | `packages/api/src/notifications` | `functions/src/notifications` (FCM) |
| messaging | `packages/api/src/messaging` | Firestore + `functions/src/messaging` |
| trips | `packages/api/src/trips` | `functions/src/trips` |
| drivers | `packages/api/src/drivers` | `functions/src/drivers` |
| passengers | `packages/api/src/passengers` | `functions/src/passengers` |
| fleet-management | `packages/api/src/fleet-management` | `functions/src/fleet-management` |
| emergency | `packages/api/src/emergency` | `functions/src/emergency` |
| wallet | `packages/api/src/wallet` | `functions/src/wallet` |
| reports | `packages/api/src/reports` | `functions/src/reports` |
| support | `packages/api/src/support` | `functions/src/support` |
| settings | `packages/api/src/settings` | `functions/src/settings` |
| analytics | `packages/api/src/analytics` | `functions/src/analytics` |

## Related Docs

- [Architecture](../architecture/ARCHITECTURE.md)
- [Database](../database/DATABASE.md)
