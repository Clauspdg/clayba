# Architecture

## Overview

The Ride is a Turborepo/pnpm monorepo containing four client applications
and one shared backend surface, all built on Firebase.

```
                         ┌─────────────────────┐
                         │      Firebase        │
                         │ Auth · Firestore ·    │
                         │ Storage · FCM ·        │
                         │ Cloud Functions        │
                         └──────────┬────────────┘
                                    │
        ┌─────────────┬────────────┼────────────┬─────────────┐
        │              │            │            │             │
   apps/web        apps/admin  apps/driver-app apps/passenger-app
  (Next.js 15)     (Next.js 15)   (Expo)          (Expo)
        │              │            │            │
        └──────────────┴──────┬─────┴────────────┘
                               │
                     packages/{ui,firebase,types,
                        utils,api,hooks,config}
```

## Guiding Principles

1. **Domain-first, not layer-first.** Every business capability (trips,
   payments, drivers, wallet, …) has a single home in each layer of the
   stack — a Zod schema in `packages/types/src/<domain>`, a data-access
   hook in `packages/api/src/<domain>`, a Cloud Function in
   `functions/src/<domain>`, and UI in each consuming app's
   `src/features/<domain>`. This keeps a feature's full vertical slice
   easy to find.
2. **Shared code lives in `packages/`, app code stays local.** Anything
   used by more than one app (design-system components, Firebase
   wrappers, types, utilities, API hooks) is a workspace package. App
   directories only contain what's specific to that app's UI/routing.
3. **Type safety end-to-end.** Zod schemas in `packages/types` are the
   single source of truth for shapes crossing a boundary (form input,
   Firestore documents, Cloud Function payloads, webhook bodies).
4. **Firestore access is centralized.** All apps and functions read/write
   Firestore through `packages/firebase`, never with ad hoc SDK calls
   scattered through app code — this keeps converters, security-rule
   assumptions, and query shapes consistent.
5. **Client vs. server Firebase SDKs are strictly separated.**
   `packages/firebase/src/client` is safe for the browser and Expo;
   `packages/firebase/src/admin` is server-only (Next.js server code,
   Cloud Functions) and must never be bundled into client code.

## Apps

| App | Framework | Audience | Notes |
| --- | --- | --- | --- |
| `apps/web` | Next.js 15 (App Router) | Passengers (public web) | SSR/SSG marketing + booking |
| `apps/admin` | Next.js 15 (App Router) | Internal ops/support staff | Fleet, trips, reports, analytics |
| `apps/driver-app` | Expo (React Native) | Drivers | Trip execution, earnings, docs |
| `apps/passenger-app` | Expo (React Native) | Passengers | Booking, tracking, payments |

## Scaling Considerations

- **Stateless app tiers.** Next.js apps deploy as stateless
  serverless/edge functions (Vercel or Cloud Run) behind a CDN — horizontal
  scaling is automatic.
- **Firestore data modeling** favors denormalization and shallow
  collections keyed for the access patterns documented in
  [docs/database/DATABASE.md](../database/DATABASE.md), to avoid hot
  documents/collections at scale.
- **Cloud Functions** are split by domain/trigger so cold starts and
  concurrency scale independently per workload (e.g. trip-matching vs.
  notification fan-out vs. payment webhooks).
- **Turborepo remote caching** keeps CI build times flat as the number of
  apps/packages grows.
- **Feature flags** (see `.env.example`) allow progressive rollout of
  high-risk domains like `emergency` and `wallet`.

## Related Docs

- [Database](../database/DATABASE.md)
- [API](../api/API.md)
- [Roadmap](../ROADMAP.md)
