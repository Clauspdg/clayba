# Roadmap

## Phase 0 — Foundation (current)

- [x] Turborepo/pnpm monorepo structure
- [x] Apps scaffolded: web, admin, driver-app, passenger-app
- [x] Shared packages scaffolded: ui, config, firebase, types, utils, api, hooks
- [x] Firebase project config (Firestore/Storage rules default deny-all)
- [x] Tooling: ESLint, Prettier, Husky, commitlint, TypeScript project refs
- [x] CI skeleton (GitHub Actions), developer PowerShell scripts
- [ ] Provision actual Firebase projects (dev/staging/prod) and secrets

## Phase 1 — Core Identity & Data Model

- [ ] Authentication (passenger/driver/admin roles, phone + email sign-in)
- [ ] Passenger profile domain
- [ ] Driver profile + document verification domain
- [ ] Firestore schema + security rules for the above (replace deny-all)

## Phase 2 — Trip Lifecycle MVP

- [ ] Maps integration (geocoding, routing, live location)
- [ ] Trip request → matching → in-progress → completed state machine
- [ ] Driver app trip execution flow
- [ ] Passenger app booking + tracking flow

## Phase 3 — Money

- [x] Payments: cash + PayPal (authorize at booking, capture at completion) — see [payments.md](payments.md)
- [x] Driver wallet + ledger (cash commission owed, PayPal earnings credited, admin cash deposits)
- [ ] Payouts to drivers (PayPal Payouts API — today recorded manually as a negative deposit)
- [ ] Card payments

## Phase 4 — Trust & Safety

- [ ] Emergency/SOS domain
- [ ] Support ticketing
- [ ] In-app messaging between passenger and driver

## Phase 5 — Operations

- [ ] Fleet management (admin)
- [ ] Reports & analytics dashboards (admin)
- [ ] Notification system hardening (FCM at scale)

## Phase 6 — Scale & Hardening

- [ ] Load testing trip-matching and payment paths
- [ ] Firestore index/query audit for hot paths
- [ ] Observability (Sentry, structured logging, uptime alerting)
- [ ] Security review + penetration test before public launch

> This roadmap will be refined per sprint — see
> [SPRINT-PLANNING.md](SPRINT-PLANNING.md) and [REQUIREMENTS.md](REQUIREMENTS.md).
