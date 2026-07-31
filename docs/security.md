# Security

## Client vs. server boundary

`packages/firebase` is split so a client bundle can never accidentally pull
in privileged code:

| Subpath | Safe in | Imports |
| --- | --- | --- |
| `@the-ride/firebase/client` | Browser, Expo | `firebase` (client SDK) |
| `@the-ride/firebase/admin` | Server only (Next.js server code, Cloud Functions) | `firebase-admin` |
| `@the-ride/firebase/auth` | Server only | `firebase-admin` (token verification, custom claims) |
| `@the-ride/firebase/firestore` | Server only | `firebase-admin` (all repositories) |

The bare `@the-ride/firebase` import re-exports nothing (see
`packages/firebase/src/index.ts`) specifically so it can never silently drag
`firebase-admin` into a client bundle. Always import the specific subpath
you need.

Every privileged write in this sprint (driver approvals, refunds, wallet
adjustments, settings changes, role assignment) is admin-SDK-only — there is
no client-writable path to any of them. See `firestore.rules`, where every
one of those collections is `allow write: if isAdmin()` or `if false`.

## Defense in depth

Two independent layers enforce the same RBAC model:

1. **Application layer** — the guards in `@the-ride/firebase/auth`
   (`requireAuth`, `requireRole`, `requirePermission`), backed by the pure
   resolution functions in `@the-ride/utils` (`hasRole`, `hasPermission`).
   This is where business logic (driver approval, refunds, ...) actually
   runs, and where `AuditLogsRepository.record()` is called.
2. **Database layer** — `firestore.rules`, which re-implements the same
   role checks using `request.auth.token.role` (the custom claim). This is
   the backstop if a bug ever let a request reach Firestore directly
   without going through a guard.

Both layers read from the same conceptual source — the `Role` enum and
`ROLE_PERMISSIONS` matrix in `packages/types` — but `firestore.rules` is a
separate language (the Firestore rules DSL) and can't literally import that
TypeScript file, so **any permission change must be applied in both
places**. See [rbac.md](./rbac.md) for the checklist.

## Audit system

Every sensitive operation writes an `auditLogs` document
(`packages/types/src/authentication` → `auditLogSchema`):

| Field | Meaning |
| --- | --- |
| `action` | One of `AUDIT_ACTIONS` (`authentication.enums.ts`) — e.g. `driver.approved`, `payment.refunded`, `role.changed` |
| `actorId` / `actorRole` | Who did it |
| `targetId` / `targetType` | What was acted on |
| `reason` | Why (required for rejections/suspensions/terminations/refunds where a repository method takes a `reason` param) |
| `metadata` | Free-form extra context (e.g. `{ amount }` for a wallet adjustment) |
| `createdAt` | Stamped by the repository, never client-supplied |

**Actions currently audited** (each corresponds to a repository method in
`packages/firebase/src/firestore`): `driver.approved`, `driver.rejected`,
`driver.activated`, `driver.suspended`, `driver.reactivated`,
`driver.warned`, `driver.terminated`, `payment.refunded`,
`wallet.adjusted`, `settings.updated`, `support.assigned`,
`report.resolved`. `vehicle.approved`, `trip.cancelled`, `user.deleted`,
and `role.changed` are reserved in `AUDIT_ACTIONS` for the vehicle
approval, trip cancellation, user deletion, and role-assignment flows
respectively, which land in a later sprint alongside their features.

Writing happens exclusively through `AuditLogsRepository.record()`
(`packages/firebase/src/firestore/authentication.repository.ts`), which
validates the entry with `buildAuditLogEntry` (`packages/utils`) before
stamping `id`/`createdAt`. `firestore.rules` makes the `auditLogs`
collection `allow write: if false` unconditionally — there is no path to
writing an audit log except through the Admin SDK.

Reading is restricted to `admin`/`super_admin` (`audit.read` permission).

## Firestore rules structure

`firestore.rules` is organized by domain, mirroring
`packages/types/src/<domain>`, with shared helper functions at the top:

```
isSignedIn()          request.auth != null
role()                request.auth.token.role
hasRole(roles)         role() in roles
isAdmin()              hasRole(['admin', 'super_admin'])
isOwner(userIdField)   userIdField == request.auth.uid
```

The general pattern per collection: owners can read/write their own
records (checked against a `userId`/`passengerId`/`driverId`/etc. field on
the document, not the document ID), staff roles get broader read access,
and anything that mutates state in a way this sprint's repositories treat
as backend-authoritative is `admin`-only. Anything not explicitly matched
falls through to the deny-all rule at the bottom of the file — the same
secure-by-default posture the file had before Sprint 1.

## Indexes

Composite indexes in `firestore.indexes.json` are added only alongside a
real query that needs them (see `docs/database/DATABASE.md`'s indexing
convention) — currently: `auditLogs` by target/actor + `createdAt`,
`driverApplications` by `status` + `createdAt` (review queue), and
`supportTickets` by `status` + `createdAt` (support queue).

## Related Docs

- [Authentication](./authentication.md)
- [RBAC](./rbac.md)
- [Firestore Schema](./firestore-schema.md)
- [Architecture (Sprint 1)](./architecture-sprint1.md)
