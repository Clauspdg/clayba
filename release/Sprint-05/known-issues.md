# Known Issues — Sprint 5 Release

- **Firebase Storage rules not yet deployed.** Storage itself has never
  been "Get Started"-ed in the `the-ride-dev` console (a one-time manual
  step — region selection — that the Firebase CLI cannot perform on its
  own). `storage.rules` is written and ready; run
  `firebase deploy --only storage --project the-ride-dev` once Storage
  is enabled via https://console.firebase.google.com/project/the-ride-dev/storage.
- **DEV seed data not yet run.** `scripts/seed-dev.ts` is complete,
  typechecked, and idempotent, but needs a real Admin SDK service
  account key for `the-ride-dev` (`FIREBASE_CLIENT_EMAIL`/
  `FIREBASE_PRIVATE_KEY` in `.env.development.local`) to execute against
  the live project.
- **Most existing dashboard/app screens still render sample data, not
  live Firestore listeners.** Real Auth, Firestore, and Storage
  connections are wired at the infrastructure level (Part 1-4), but
  migrating each individual screen (admin tables, driver/passenger
  booking flows) to live queries is follow-up work, consistent with
  every prior sprint's documented scope notes.
- **No iOS builds.** This sprint's Part 7 asked for Android APK/AAB
  only; iOS builds need an Apple Developer account and are unstarted.
- **Native push notifications and native Analytics/Crashlytics are not
  implemented** — the Firebase JS SDK's Analytics/Messaging only work on
  web (`apps/web`/`apps/admin`); the native apps would need
  `expo-notifications` (push) and `@react-native-firebase/*` (native
  Analytics/Crashlytics), neither of which is installed this sprint —
  consistent with every prior sprint's "no push notifications" scope
  boundary.
- **Vehicle photo upload has no dedicated screen yet.** The Storage
  helper function (`uploadVehiclePhoto`) is implemented and ready, but no
  UI currently calls it — a vehicle-photo capture flow doesn't exist in
  any app yet.
- **EAS project owner is a personal Expo account** (`clauspp`), not an
  organization — fine for DEV, but worth migrating to a team/org account
  before a real production release.
