# Deployment (Sprint 4.6 — Release Pipeline)

This sprint's objective wasn't a new feature — it was making every
previous sprint's work deployable and testable. This doc is the map of
how all the pieces fit together; the other four Sprint 4.6 docs
(docs/firebase-hosting.md, docs/android-build.md, docs/release-process.md,
docs/versioning.md) go deep on one piece each.

## Environments

Three Firebase projects, one per environment:

| `APP_ENV` | Firebase project | Env file | Domain (web / admin) |
| --- | --- | --- | --- |
| `development` | `the-ride-dev` | `.env.development` | `localhost:3000` / `localhost:3001` |
| `staging` | `the-ride-staging` | `.env.staging` | `staging.the-ride.app` / `admin-staging.the-ride.app` |
| `production` | `the-ride-prod` | `.env.production` | `the-ride.app` / `admin.the-ride.app` |

All three `.env.*` files are checked in with every secret-shaped value
left blank (same pattern as the pre-existing `.env.example`) — never a
place for real credentials. Domains are read from `APP_URL`/`ADMIN_URL` in
each file, never hardcoded into app source (Parts 8-9).

`packages/config/env/schema.ts` has the Zod schemas every app's Firebase
init validates against, now including `nextPublicBuildInfoEnvSchema`/
`expoPublicBuildInfoEnvSchema` for the Build Info fields (see
docs/versioning.md).

## Build pipeline scripts

Root `package.json`:

| Script | What it does |
| --- | --- |
| `build:web` / `build:admin` / `build:driver` / `build:passenger` | `turbo run build --filter=<app>` — build one app in isolation |
| `version:show` / `version:bump` | Read/bump the centralized version — see docs/versioning.md |
| `release` | Generate `/release/v{version}/` — see docs/release-process.md |
| `staging` / `production` | Build web+admin against the matching `.env.<environment>`, then print (dry run) or run (`-- --deploy`) the `firebase deploy` command — see docs/firebase-hosting.md |

None of `staging`/`production`/`release`/`build:driver`/`build:passenger`
run as part of this sprint's quality gates (`pnpm install/typecheck/lint/test/dev`)
— they're operator-triggered, on purpose.

## Firebase Hosting

See docs/firebase-hosting.md for the full detail. Summary: `apps/web` and
`apps/admin` are static Next.js exports (`output: "export"`), deployed to
two Firebase Hosting targets (`web`, `admin`) inside whichever project is
active. Headers, cache-control, and security headers are all prepared in
`firebase.json`.

## Android release

See docs/android-build.md. Summary: `apps/driver-app` and
`apps/passenger-app` each have an `eas.json` with `development`/`preview`/
`production`/`production-apk` profiles, and an `app.json` with a
`versionCode` + EAS project ID placeholder. Real builds require EAS
credentials this sandboxed environment doesn't have — the pipeline is
fully prepared, not executed.

## Release folder

See docs/release-process.md. `pnpm release` (or `node
scripts/generate-release.mjs`) produces `/release/v{version}/` with
release notes, a machine-readable `version.json`, known issues, checksums,
and the four Android artifacts (real if `--artifacts-dir` points at a
downloaded EAS build, placeholder otherwise).

## GitHub Actions

| Workflow | Trigger | Does |
| --- | --- | --- |
| `ci.yml` (pre-existing) | push/PR to `main` | lint, type-check, test, then build everything |
| `deploy-web.yml` / `deploy-admin.yml` (pre-existing) | push to `main` | auto-deploys `apps/web`/`apps/admin` to the *default* Firebase project's hosting |
| `deploy-functions.yml` (pre-existing) | push to `main` | auto-deploys Cloud Functions + Firestore/Storage rules |
| `hosting.yml` (this sprint) | manual, environment input (staging/production) | build + deploy hosting via `scripts/deploy-hosting.mjs --deploy` |
| `android.yml` (this sprint) | manual, app + profile inputs | triggers an EAS Build |
| `release.yml` (this sprint) | manual, optional artifacts-dir input | quality gates + `generate-release.mjs`, uploads `/release` as a workflow artifact |

`hosting.yml`/`android.yml`/`release.yml` are all `workflow_dispatch`-only
(no push trigger) — per Parts 2/8/9, this sprint prepares deployment, it
doesn't wire anything to deploy automatically beyond what already existed
(the pre-existing `deploy-*.yml` files, which predate this sprint and are
left as-is rather than modified). No workflow embeds a real secret value —
every `${{ secrets.* }}` reference needs a repository/environment secret
configured before that workflow can run for real.

## End-to-end: shipping a release

```
pnpm version:bump -- patch          # bump the version
pnpm typecheck && pnpm lint && pnpm test   # confirm the gates still pass
pnpm release                        # generate /release/v{version}/
pnpm staging                        # (dry run) review the staging deploy command
pnpm staging -- --deploy            # actually deploy staging
#  ...verify staging manually...
pnpm production -- --deploy         # actually deploy production
gh release create vX.Y.Z release/vX.Y.Z/* --notes-file release/vX.Y.Z/release-notes.md
```

Every step above is a deliberate, manual invocation — nothing in this
sprint deploys or publishes on its own.

## Related Docs

- [Firebase Hosting](./firebase-hosting.md)
- [Android Build](./android-build.md)
- [Release Process](./release-process.md)
- [Versioning](./versioning.md)
