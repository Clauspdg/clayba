# Authentication

Sprint 1 backend foundation for authenticating and identifying users across
all four apps. No sign-in UI is implemented here — this is the shared,
reusable layer every app's future login screen will call into.

## Roles

Seven platform roles, defined once in `packages/types/src/authentication/authentication.enums.ts`:

| Role | Description |
| --- | --- |
| `passenger` | Books and takes rides |
| `driver` | Fulfills rides |
| `dispatcher` | Assigns/monitors trips operationally |
| `support` | Handles support tickets and user-facing issues |
| `moderator` | Reviews ratings/reviews/reports for policy violations |
| `admin` | Operates the platform (driver approvals, refunds, settings) |
| `super_admin` | Full access, including role assignment and irreversible actions |

See [rbac.md](./rbac.md) for what each role can actually do.

## Identity model

- **Firebase Authentication** is the identity provider for every app.
- A user's role lives in **two places that must stay in sync**:
  1. Firebase Auth **custom claims** (`{ role, permissions? }`) — this is
     what security rules and server-side guards check.
  2. The `users` Firestore document (`packages/types/src/authentication`) —
     this is what the UI reads to render role-appropriate views.
- The only sanctioned way to change a user's role is
  `assignUserRole(uid, role)` in `packages/firebase/src/auth/service.ts`,
  which sets the custom claim. Never write `role` to Firestore without also
  calling this, or the token and the document will drift.

## Auth claims

```ts
interface AuthClaims {
  uid: string;
  role: Role;
  permissions?: Permission[]; // rare: explicit grants beyond the role's default matrix
}
```

Source of truth: `packages/types/src/authentication/authentication.schemas.ts` (`authClaimsSchema`).

## Shared services (`packages/firebase/src/auth`)

| Export | Purpose |
| --- | --- |
| `verifyIdToken(idToken)` | Server-only. Verifies a client ID token, returns `AuthClaims`. |
| `assignUserRole(uid, role)` | Server-only. Sets the Firebase Auth custom claim. |
| `revokeUserSessions(uid)` | Server-only. Forces re-authentication (e.g. after suspension). |
| `buildCustomClaims(role, permissions?)` | Pure. Shapes the claim object written to Firebase Auth. |
| `parseAuthClaims(decoded)` | Pure. Normalizes a decoded token into `AuthClaims`. |

All of the above import `firebase-admin` — never import
`@the-ride/firebase/auth` from client/Expo code. See
[security.md](./security.md) for the client/server boundary.

## Guards

Three composable, throw-on-failure guards in `packages/firebase/src/auth`:

```ts
requireAuth(claims);                    // throws UnauthorizedError if not signed in
requireRole(claims, [Role.ADMIN]);      // throws ForbiddenError if role doesn't match
requirePermission(claims, "driver.approve"); // throws ForbiddenError if permission is missing
```

Each guard returns the validated `AuthClaims` on success, so call sites can
chain: `const { uid } = requirePermission(claims, "driver.approve");`

These are plain functions with no framework dependency — call them from a
Cloud Function, a Next.js server action, or a route handler alike.

## Related Docs

- [RBAC](./rbac.md)
- [Security](./security.md)
- [Driver Management](./driver-management.md)
- [Architecture (Sprint 1)](./architecture-sprint1.md)
