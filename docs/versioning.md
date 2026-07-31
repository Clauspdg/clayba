# Versioning (Sprint 4.6, Part 6)

Single source of truth: `packages/types/src/version.ts`.

```ts
export const RELEASE_VERSION = { major: 0, minor: 1, patch: 0 } as const;
export const RELEASE_SPRINT = "4.6";
export const ANDROID_VERSION_CODES = { driver: 1, passenger: 1 } as const;
```

Every app that needs to display or reason about the release — web, admin,
driver-app, passenger-app — imports this from `@the-ride/types`, the same
way they already import every other cross-cutting constant in this repo.
It isn't a Firestore business domain, so it isn't nested under any of the
15 domain folders — it sits at the same tier as the package's root barrel.

## What's static vs. build-time

| Field | Source | Why |
| --- | --- | --- |
| `major`/`minor`/`patch` | `RELEASE_VERSION` (checked-in) | Bumped deliberately, once per release |
| `sprint` | `RELEASE_SPRINT` (checked-in) | Bumped once per sprint |
| Android `versionCode` | `ANDROID_VERSION_CODES` (checked-in) | Must monotonically increase per Play Store listing |
| `commit` | env var, injected at build time | Only known once you're building a specific checkout |
| `buildDate` | env var, injected at build time | Only known at the moment of the build |
| `environment` | env var, injected at build time | Which `.env.*` file the build used |
| `firebaseProjectId` | env var, injected at build time | Which Firebase project the build points at |

`resolveBuildInfo()` (also in `version.ts`) assembles the full `BuildInfo`
shape from whatever env values the caller passes in, falling back to
clearly-labeled placeholders (`"dev"`, `"unknown"`) when they're absent —
which is always true for a plain local `pnpm dev` run, and expected.

### Which env var backs which field, per app

| Field | Next.js (web/admin) | Expo (driver-app/passenger-app) |
| --- | --- | --- |
| `environment` | `NEXT_PUBLIC_APP_ENV` | `EXPO_PUBLIC_APP_ENV` |
| `firebaseProjectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `EXPO_PUBLIC_FIREBASE_PROJECT_ID` |
| `commit` | `NEXT_PUBLIC_BUILD_COMMIT` | `EXPO_PUBLIC_BUILD_COMMIT` |
| `buildDate` | `NEXT_PUBLIC_BUILD_DATE` | `EXPO_PUBLIC_BUILD_DATE` |

These are declared (blank) in `.env.development`/`.env.staging`/`.env.production`
and in `.env.example`. `scripts/deploy-hosting.mjs` fills in
`*_BUILD_COMMIT`/`*_BUILD_DATE` automatically from `git`/the current
timestamp before building web/admin; EAS builds get them from `eas.json`'s
per-profile `env` block plus EAS's own build-time environment.

### Why `.env.staging` needs a script, not `next build` directly

Next.js auto-loads `.env.development`/`.env.production` based on
`NODE_ENV`, but `NODE_ENV` only has three values
(`development`/`test`/`production`) — there's no built-in `NODE_ENV=staging`.
`.env.staging` is therefore never auto-loaded by `next build` alone.
`scripts/deploy-hosting.mjs` (Parts 8-9) reads the right `.env.<environment>`
file explicitly via Node's built-in `process.loadEnvFile()` before invoking
the build, which is why `pnpm staging`/`pnpm production` exist as the
supported entry points instead of calling `next build` by hand.

## `scripts/version.mjs`

```
node scripts/version.mjs show [--json]
node scripts/version.mjs bump <major|minor|patch>
```

- `show` prints the current version plus the live `commit`
  (`git rev-parse --short HEAD`, falling back to `"dev"` outside a git
  checkout) and `buildDate` (current timestamp).
- `bump` increments the given segment (resetting lower segments, standard
  semver behavior), increments **both** apps' Android `versionCode` by 1,
  and rewrites three files together so nothing drifts:
  `packages/types/src/version.ts`, `apps/driver-app/app.json`,
  `apps/passenger-app/app.json`. EAS reads `app.json`
  (`eas.json`'s `appVersionSource: "local"`), not `version.ts` — hence
  both must change on every bump.

## Related Docs

- [Release Process](./release-process.md)
- [Android Build](./android-build.md)
- [Deployment](./deployment.md)
