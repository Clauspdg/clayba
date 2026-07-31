# Architecture — Sprint 1: Enterprise Backend Foundation

Sprint 1 builds the backend/business-logic foundation on top of Sprint 0's
scaffolding: authentication, RBAC, the Firestore domain model, the driver
recruitment pipeline, driver management, passenger domain models, the audit
system, Firestore security, and shared environment config. No UI, no
screens, no trip/payment processing — see the individual docs linked below
for each area.

## What was added, by package

| Package | What Sprint 1 added |
| --- | --- |
| `packages/types` | 12 of the existing 15 domain folders now have real content: enums, Zod schemas (+ inferred TS types), and collection-name constants for all 20 requested collections plus `passengers`. |
| `packages/utils` | `authentication/` (RBAC resolution, audit-entry builder) and `drivers/` (workflow state machine, score, document expiration) — pure, framework-agnostic functions. First real cross-package dependency: `utils` now depends on `types`. |
| `packages/firebase` | `admin/` and `client/` app bootstrap, `auth/` (claims, errors, three guards, token/role service), `firestore/` (Zod-backed converter, generic repository, one repository file per domain, a `createRepositories()` factory). Now depends on `types` and `utils`. |
| `packages/config` | `env/` — Zod schemas for server and per-app-family client environment variables, plus a `validateEnv()` helper. |
| root | `firestore.rules` rewritten from deny-all to real RBAC-based rules per collection; `firestore.indexes.json` given the composite indexes the new repository methods actually need. |

## Key decisions

**No new top-level domain folder.** `docs/architecture/folder-structure.md`
documents a fixed set of 15 business domains. Audit logs could plausibly
have been their own domain, but to avoid adding a 16th, `AuditLog` lives in
`authentication` (it's fundamentally a security/access-accountability
concern, and that's where `Role`/`Permission` already live).

**`passengers` is a new collection, not a new domain** — the `passengers`
*domain folder* already existed (Sprint 0 scaffolding); this sprint just
filled it in. It wasn't in Part 3's literal 20-collection list, but Part 6
explicitly asks for a passenger profile distinct from `users`, matching the
`drivers`/`users` split already in the schema, and matching what
`docs/database/DATABASE.md` had already planned for this domain.

**Driver management lives on the repository, not a separate "services"
layer.** `docs/architecture/folder-structure.md` documents
`packages/firebase/src/{client,admin,auth,firestore,storage,messaging}` as
a fixed set of subfolders. Rather than adding a `services/` folder, Part
5's six driver actions (approve/reject/activate/suspend/reactivate/warn/
terminate) are methods on `DriversRepository` — each one validates its
precondition, writes the change, and records an audit log in one call. Same
pattern for wallet adjustments, payment refunds, settings updates, support
ticket assignment, and report resolution.

**The bare `@the-ride/firebase` import re-exports nothing.** `auth/` and
`firestore/` both import `firebase-admin`; re-exporting them from the root
barrel would let a careless `import { x } from "@the-ride/firebase"` in a
client app silently pull `firebase-admin` into a browser/Expo bundle.
Consumers import the specific subpath they need
(`@the-ride/firebase/admin`, `/auth`, `/firestore`, or the client-safe
`/client`) — see [security.md](./security.md).

**Env config stays a library, not wired into any app yet.** Part 9 says
"shared configuration only," and Sprint 1 is explicitly no-UI — so
`packages/config/env` exists and is tested-by-inspection, but no
`next.config.ts` or Cloud Function calls `validateEnv()` yet. Wiring it in
is a natural first step of whichever sprint adds real app bootstrapping.

## A real bug this sprint's cross-package imports surfaced

Sprint 0 set `"composite": true` on every package's shared base tsconfig
(`packages/config/typescript/base.json`), intending to support TypeScript
project references. It was never exercised, because no package imported
another package's source yet — every domain folder was an `export {}`
placeholder. The moment `packages/utils` started importing real types from
`packages/types`, `tsc` failed with `TS6059`/`TS6307`/`TS6305`: composite
mode requires cross-project imports to go through *built* `.d.ts` output
via explicit project references, but nothing in this repo ever runs
`tsc -b` — every package ships raw TypeScript source consumed directly by
the importing app's bundler (Next.js `transpilePackages`, Metro), exactly
like Sprint 0's own `next build` test proved. `composite` was dead
configuration that only became a real, monorepo-wide blocker once genuine
cross-package imports existed.

Fix: removed `composite: true` from `packages/config/typescript/base.json`,
and removed the now-inert `rootDir`/`outDir` pair from `packages/utils` and
`packages/firebase`'s own `tsconfig.json` (they existed for the same never-
run build step). No other package was affected — verified with a full
`pnpm typecheck` before and after.

## Related Docs

- [Authentication](./authentication.md)
- [RBAC](./rbac.md)
- [Firestore Schema](./firestore-schema.md)
- [Security](./security.md)
- [Driver Management](./driver-management.md)
- [Architecture (Sprint 0)](./architecture/ARCHITECTURE.md)
