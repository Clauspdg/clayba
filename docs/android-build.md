# Android Build (Sprint 4.6, Part 4)

`apps/driver-app` and `apps/passenger-app` each have an `eas.json` with
four build profiles:

| Profile          | Distribution         | Android output                                                                                          | `APP_ENV`     |
| ---------------- | -------------------- | ------------------------------------------------------------------------------------------------------- | ------------- |
| `development`    | internal, dev client | APK                                                                                                     | `development` |
| `preview`        | internal             | APK                                                                                                     | `staging`     |
| `production`     | store                | AAB (Play Store submission format)                                                                      | `production`  |
| `production-apk` | store                | APK (extends `production` — same version/env, different package format for direct-install distribution) | `production`  |

**Firebase config for real builds**: `eas.json`'s `env` blocks only set
`APP_ENV` — they never contained `EXPO_PUBLIC_FIREBASE_*`. Local dev gets
those from each app's gitignored `.env.local` (Metro reads it directly),
but a real EAS cloud build has no access to that file, so it needs the
same values configured as **EAS project environment variables** instead
(`eas env:create --environment production --name EXPO_PUBLIC_FIREBASE_API_KEY --value ... --visibility plaintext`,
repeated for `AUTH_DOMAIN`/`PROJECT_ID`/`STORAGE_BUCKET`/`MESSAGING_SENDER_ID`/`APP_ID`,
for both the `production` and `preview` environments). Missing this is
exactly what shipped `playba-driver-v0.1.0.apk` (CLAYBA Driver P0):
`initializeApp()` ran with an `undefined` config and threw during module
evaluation, before React ever rendered a frame — a blank white screen on
every launch, confirmed by extracting the shipped APK's JS bundle and
finding zero occurrences of the real Firebase project id anywhere in it.
Run `eas env:list --environment production` before any release build to
confirm these are actually set — these are Firebase's public client
values (safe by Firebase's own security model, same as any other
`EXPO_PUBLIC_*`/`NEXT_PUBLIC_*` value already elsewhere in this repo), not
secrets, so `--visibility plaintext` is correct, not `sensitive`/`secret`.

`"appVersionSource": "local"` means EAS reads `version`/`android.versionCode`
straight from each app's `app.json` — it does not maintain its own remote
counter. That's why `scripts/version.mjs bump` writes `app.json` directly
(see docs/versioning.md) rather than relying on EAS's `autoIncrement`
alone; `production`'s `"autoIncrement": true` is a safety net that bumps
`versionCode` by 1 automatically if a build is re-run without a version
bump in between, not the primary mechanism.

## `app.json` additions

Both apps' `app.json` now have:

```json
"android": { "versionCode": 1, ... },
"extra": { "eas": { "projectId": "REPLACE_WITH_EAS_PROJECT_ID_..." }, ... }
```

`extra.eas.projectId` is a placeholder — EAS CLI requires a real project ID
(created via `eas project:init`, which needs an authenticated Expo account
this sandboxed environment doesn't have). Replace it before running any
real `eas build`.

## Running a real build (not part of this sprint's gates)

```
cd apps/driver-app
eas login                                  # once, interactively
eas build --platform android --profile preview        # staging APK
eas build --platform android --profile production      # store AAB
eas build --platform android --profile production-apk  # direct-install APK, same version
```

Or via the prepared `android.yml` GitHub Actions workflow
(`workflow_dispatch`, choose app + profile) — see docs/deployment.md.
Both require an `EXPO_TOKEN` (repository secret, placeholder in the
workflow) from an Expo account with access to each app's EAS project.

## Why this sprint doesn't produce real `.apk`/`.aab` files

`eas build` submits the job to Expo's build service over the network and
needs a signed-in EAS account plus, for the very first build, Android
keystore generation (which EAS can do for you, but still requires that
authenticated session). This sandboxed environment has neither network
access to Expo's build service nor any Expo credentials, so it cannot
produce real binaries — `scripts/generate-release.mjs` writes clearly
labeled placeholder files in their place (see docs/release-process.md)
rather than fabricating something that looks like a working APK/AAB but
isn't.

## Versioning and release notes (Part 4)

- **Versioning**: `RELEASE_VERSION` in `packages/types/src/version.ts`,
  mirrored into both `app.json`'s `expo.version` — see docs/versioning.md.
- **Build number**: `ANDROID_VERSION_CODES.driver`/`.passenger`, mirrored
  into `app.json`'s `expo.android.versionCode`.
- **Release notes**: `release-notes.md` inside each generated
  `/release/v{version}/` folder — see docs/release-process.md.

## Related Docs

- [Release Process](./release-process.md)
- [Versioning](./versioning.md)
- [Deployment](./deployment.md)
