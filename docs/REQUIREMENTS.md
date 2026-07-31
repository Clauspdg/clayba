# Requirements

## Functional Scope (by domain)

These are the 15 business domains the platform is architected around.
Detailed functional requirements should be added under each as feature
work begins.

- **Authentication** — passenger/driver/admin sign-up & sign-in (phone
  OTP, email/password, social), session management, role-based access.
- **Payments** — payment methods on file, trip charges, refunds, payout
  processing to drivers.
- **Maps** — geocoding, routing/ETA, live location tracking, geofencing.
- **Notifications** — push (FCM), transactional email/SMS.
- **Messaging** — in-app passenger↔driver chat during an active trip.
- **Trips** — request, matching, lifecycle state machine, fare
  calculation, receipts.
- **Drivers** — profile, document verification, availability, earnings.
- **Passengers** — profile, ride history, favorites/saved places.
- **Fleet Management** — vehicle onboarding, compliance, assignment.
- **Emergency** — SOS trigger, incident logging, emergency contacts.
- **Wallet** — passenger/driver balance, top-up, ledger, withdrawals.
- **Reports** — operational reporting for admin/ops staff.
- **Support** — ticketing, in-app help, dispute resolution.
- **Settings** — user preferences, app configuration, feature flags.
- **Analytics** — usage/business metrics dashboards for admin.

## Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| Scale | Architecture must support millions of registered users and concurrent active trips |
| Availability | Core trip-booking and emergency paths target high availability (multi-region considerations deferred to Phase 6) |
| Latency | Trip matching and live-location updates require low end-to-end latency |
| Security | PII and payment data handled per least-privilege Firestore/Storage rules; no secrets in source control |
| Compliance | Payment flows must stay out of PCI scope on the client (tokenization via payment provider) |
| Observability | All apps/functions must support structured logging and error tracking (Sentry wired via `.env`) |
| Portability | Business logic isolated in `packages/*` so it is not locked to a single hosting provider |

## Out of Scope (for this architecture-setup phase)

- Business logic implementation
- Booking/trip-matching algorithms
- UI screens/components
- Real Firebase project provisioning and secrets

Track feature-level requirements per domain as they're scoped in
[SPRINT-PLANNING.md](SPRINT-PLANNING.md).
