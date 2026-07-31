# Firebase Hosting (Sprint 4.6, Part 2)

`apps/web` and `apps/admin` deploy as static exports to two Firebase
Hosting targets (`web`, `admin`) inside whichever Firebase project is
currently selected (dev/staging/prod — see docs/deployment.md).

## Static export

Both apps now set `output: "export"` in their `next.config.ts`
(`apps/web/next.config.ts`, `apps/admin/next.config.ts`) — `next build`
produces a static `out/` directory instead of requiring a Node server.
This is safe for both apps: neither has API routes, server actions, or
dynamic `[param]` routes, and `images.unoptimized: true` is set alongside
`output: "export"` since Next's Image Optimization API needs a server
static hosting doesn't have.

`firebase.json`'s `hosting[].public` already pointed at `apps/web/out`/
`apps/admin/out` before this sprint; adding `output: "export"` is what
makes that directory actually get produced.

## `.firebaserc` — projects and targets

```json
{
  "projects": {
    "default": "the-ride-dev",
    "development": "the-ride-dev",
    "staging": "the-ride-staging",
    "production": "the-ride-prod"
  },
  "targets": { "the-ride-dev": {...}, "the-ride-staging": {...}, "the-ride-prod": {...} }
}
```

Note the production Firebase project's real ID is **`the-ride-prod`**, not
`the-ride-production` — this predates this sprint (Sprint 0's original
`.firebaserc`) and is kept as-is rather than renamed, to avoid breaking
whatever real Firebase project already exists under that ID.

Each project alias has hosting **targets** mapping the two logical sites
(`web`, `admin`) used in `firebase.json` to real Firebase Hosting site IDs
per environment — `the-ride-web-dev`/`the-ride-admin-dev`,
`the-ride-web-staging`/`the-ride-admin-staging`,
`the-ride-web-prod`/`the-ride-admin-prod`. These site IDs are **not**
created by this sprint (that requires `firebase hosting:sites:create` +
`firebase target:apply`, both of which need real Firebase CLI
authentication this sandboxed environment doesn't have) — only the
`.firebaserc` mapping is prepared. Before the first real staging/production
deploy, an operator must run:

```
firebase hosting:sites:create the-ride-web-staging --project the-ride-staging
firebase hosting:sites:create the-ride-admin-staging --project the-ride-staging
firebase target:apply hosting web the-ride-web-staging --project the-ride-staging
firebase target:apply hosting admin the-ride-admin-staging --project the-ride-staging
```
(and the equivalent for `the-ride-prod`).

## Headers, cache, and security

`firebase.json`'s `hosting[].headers` (added this sprint) covers both
targets:

| Path pattern | Cache-Control |
| --- | --- |
| `*.js`, `*.css`, fonts | `public, max-age=31536000, immutable` (hashed filenames — safe to cache forever) |
| Images | `public, max-age=86400` |
| `*.json`/`*.xml`/`*.txt` (web only) | `public, max-age=3600` |
| `*.html` | `public, max-age=0, must-revalidate` (always re-check, since these embed the hashed asset references) |

Every response also gets:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(self), camera=(), microphone=()` — geolocation stays available to the app itself (maps/pricing need it), camera/microphone are blocked outright since neither app uses them
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

The `admin` target additionally sends `X-Robots-Tag: noindex, nofollow` —
it's an internal back office, not something that should show up in search
results.

`cleanUrls: true` and `trailingSlash: false` are set on both targets for
consistent, extension-less URLs.

## Deploying (not part of this sprint's gates — manual/CI only)

```
pnpm staging                # builds web+admin, prints the deploy command (dry run)
pnpm staging -- --deploy    # builds and actually deploys to the-ride-staging
pnpm production              # same, dry run against the-ride-prod
pnpm production -- --deploy  # actually deploys to the-ride-prod
```

See `scripts/deploy-hosting.mjs` and docs/deployment.md for exactly what
these do and why they default to a dry run.

## Related Docs

- [Deployment](./deployment.md)
- [Versioning](./versioning.md)
- [Release Process](./release-process.md)
