# The Ride — Sprint 5 Release

**Version:** 0.2.0
**Sprint:** 5 — Production Integration, Firebase Connection & Android Release
**Date:** 2026-08-01
**Firebase project:** the-ride-dev

## Highlights

This sprint connected the entire project to a real Firebase project
(`the-ride-dev`) for the first time and produced the first real,
installable Android builds.

- **Real Firebase Authentication** — email/password sign-in, session
  persistence, and logout for all 6 roles (Passenger, Driver, Admin,
  Dispatcher, Support, Super Admin), replacing every placeholder auth
  context across the admin dashboard, driver app, and passenger app.
- **Real Firestore** — every repository built in Sprint 1 is now backed
  by a live database (Firestore was not even provisioned in `the-ride-dev`
  until this sprint's first deploy created it).
- **Real Storage uploads** — driver documents, driver profile photo, and
  passenger avatar now upload to Firebase Storage from their existing
  screens.
- **Website and Admin Dashboard are live**:
  - https://the-ride-web-dev.web.app
  - https://the-ride-admin-dev.web.app
- **Real Android builds** — Passenger and Driver now have real, signed
  APK and AAB builds (see below), the first native builds this project
  has ever produced.
- **Analytics/Cloud Messaging** connected for web/admin; Remote Config,
  App Check, and Crashlytics are prepared (not yet activated) per this
  sprint's explicit "prepare only" scope for those three.

## Apps in this release

| App       | Version | Android versionCode |
| --------- | ------- | ------------------- |
| Passenger | 0.2.0   | see version.json    |
| Driver    | 0.2.0   | see version.json    |

## Notable fixes made along the way

- **`.gitignore` bug**: a bare `lib/` pattern (meant only for
  `functions/lib/`, Cloud Functions' compiled output) was silently
  excluding every app's real `src/lib/` source folder from git —
  including the new Firebase client-init modules this sprint added.
  Scoped to `/functions/lib/` only.
- **React version mismatch**: `apps/driver-app`/`apps/passenger-app`
  were resolving React 19 (hoisted from the web/admin Next.js 15
  requirement) against React Native 0.76, which expects React 18. This
  was harmless for JS bundling but broke the first real native Android
  Gradle compile. Pinned both native apps to React 18.3.1 / React Native
  0.76.9 (Expo SDK 52's own recommended versions), independent of
  web/admin's React 19.

See docs/release-process.md for how this release was assembled and
docs/versioning.md for what each version field means.
