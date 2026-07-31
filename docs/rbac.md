# Role-Based Access Control (RBAC)

## Source of truth

Everything on this page is generated from two files — if this page and the
code ever disagree, the code wins and this page needs updating:

- Roles + permissions: `packages/types/src/authentication/authentication.enums.ts`
- The role -> permission matrix: `packages/types/src/authentication/authentication.constants.ts` (`ROLE_PERMISSIONS`)

Resolution logic (the only place allowed to answer "does this role have this
permission?"): `packages/utils/src/authentication/rbac.ts`.

## Roles

`passenger`, `driver`, `dispatcher`, `support`, `moderator`, `admin`, `super_admin`.

`super_admin` implicitly holds **every** permission in the list below —
it's the only role not enumerated per-permission in the matrix (see
`ROLE_PERMISSIONS[Role.SUPER_ADMIN]` in the constants file).

`ROLE_HIERARCHY` additionally ranks roles numerically, but only for "can
this actor manage a user with this role" checks (e.g. only Admin+ may
assign roles) — it is **not** a permission-inheritance chain. A dispatcher
ranking above support does not mean dispatcher inherits support's grants;
every role's permissions are authored explicitly below.

## Permission matrix

✓ = granted. `super_admin` (not shown) has every permission.

| Permission | Passenger | Driver | Dispatcher | Support | Moderator | Admin |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| `trip.create` | ✓ | | | | | |
| `trip.read` | | ✓ | ✓ | ✓ | | ✓ |
| `trip.update` | | ✓ | ✓ | | | |
| `trip.cancel` | ✓ | | | | | |
| `trip.assign` | | | ✓ | | | ✓ |
| `driver.read` | | ✓ | ✓ | | ✓ | ✓ |
| `driver.update` | | | | | | ✓ |
| `driver.approve` | | | | | | ✓ |
| `driver.reject` | | | | | | ✓ |
| `driver.activate` | | | | | | ✓ |
| `driver.suspend` | | | | | | ✓ |
| `driver.reactivate` | | | | | | ✓ |
| `driver.warn` | | | | | | ✓ |
| `driver.terminate` | | | | | | ✓ |
| `vehicle.read` | | ✓ | ✓ | | | ✓ |
| `vehicle.update` | | ✓ | | | | ✓ |
| `vehicle.approve` | | | | | | ✓ |
| `payment.read` | | | | | | ✓ |
| `payment.refund` | | | | | | ✓ |
| `payment.capture` | | | | | | |
| `wallet.read` | ✓ | ✓ | | | | ✓ |
| `wallet.adjust` | | | | | | ✓ |
| `commission.read` | | | | | | ✓ |
| `commission.update` | | | | | | ✓ |
| `user.read` | | | | ✓ | ✓ | ✓ |
| `user.update` | | | | | | ✓ |
| `user.delete` | | | | | | |
| `user.role.assign` | | | | | | |
| `settings.read` | | | | | | ✓ |
| `settings.update` | | | | | | ✓ |
| `support.read` | | | | ✓ | | ✓ |
| `support.assign` | | | | ✓ | | ✓ |
| `support.resolve` | | | | ✓ | | ✓ |
| `reports.read` | | | | ✓ | ✓ | ✓ |
| `reports.review` | | | | | ✓ | ✓ |
| `analytics.view` | | | | | | ✓ |
| `audit.read` | | | | | | ✓ |
| `rating.read` | ✓ | ✓ | | | ✓ | ✓ |
| `rating.moderate` | | | | | ✓ | ✓ |
| `review.moderate` | | | | | ✓ | ✓ |
| `notification.send` | | | | | | ✓ |
| `emergency.read` | | ✓ | ✓ | ✓ | | ✓ |
| `emergency.respond` | | | ✓ | | | ✓ |

`payment.capture`, `user.delete`, and `user.role.assign` are deliberately
`super_admin`-only — no other role holds them, by design.

## Usage

```ts
import { hasPermission, hasRole, isAtLeastRole } from "@the-ride/utils";
import { requirePermission, requireRole } from "@the-ride/firebase/auth";

// Boolean check
if (hasPermission(claims.role, "driver.approve")) { ... }

// Assertion (throws ForbiddenError/UnauthorizedError)
requirePermission(claims, "driver.approve");
requireRole(claims, [Role.ADMIN, Role.SUPER_ADMIN]);
```

## Adding a new permission

1. Add the string to `PERMISSIONS` in `authentication.enums.ts`.
2. Grant it to the appropriate role(s) in `ROLE_PERMISSIONS`.
3. Update this table.
4. If the permission gates a Firestore write, add the matching check to
   `firestore.rules` (see [security.md](./security.md)).

## Related Docs

- [Authentication](./authentication.md)
- [Security](./security.md)
- [Architecture (Sprint 1)](./architecture-sprint1.md)
