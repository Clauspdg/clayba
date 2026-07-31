# System Design Notes

> This document tracks high-level system design decisions as domains are
> implemented. It intentionally contains no business logic yet — only the
> conventions new domain work should follow.

## Request Flow (target shape)

```
Client (web/admin/driver-app/passenger-app)
  → packages/api/src/<domain>  (React Query hook, calls Firebase client SDK
    or a Next.js Route Handler)
    → packages/firebase/src/client  (Auth/Firestore/Storage client SDK)
      → Firebase (Firestore / Storage / Auth)
    → functions/src/<domain>  (Cloud Function, for privileged operations:
      payments, trip matching, notifications fan-out)
      → packages/firebase/src/admin  (Admin SDK)
        → Firebase
```

## Cross-cutting concerns to design per domain (not yet implemented)

- **Authentication**: session/claims strategy, role-based access
  (passenger, driver, admin, support), custom claims for fleet ownership.
- **Payments**: PCI-scope boundary (client never touches raw card data),
  idempotency keys for charge/payout operations, webhook signature
  verification in `functions/src/payments`.
- **Maps**: server-side vs. client-side geocoding/routing API usage,
  rate-limit and cost controls on the Google Maps API key.
- **Trips**: state machine for trip lifecycle, real-time location updates
  (Firestore listeners vs. a dedicated realtime channel), matching
  algorithm placement (Cloud Function vs. external service).
- **Notifications / Messaging**: FCM topic vs. token targeting, in-app
  chat transport, delivery-failure handling.
- **Fleet Management / Reports / Analytics**: read-model design —
  likely a separate aggregated/denormalized Firestore collection or
  BigQuery export rather than querying operational collections directly.
- **Emergency**: latency budget and redundancy requirements (this domain
  should not depend on non-critical services being healthy).
- **Wallet**: ledger design (append-only transactions vs. mutable
  balance), reconciliation with the Payments domain.

## Decisions Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-07-26 | Adopt Turborepo + pnpm monorepo with domain-first folders | Keep a feature's full vertical slice discoverable; scale CI via caching |
| 2026-07-26 | Firestore security rules default to deny-all | No collections exist yet; force explicit, reviewed rules per domain |
