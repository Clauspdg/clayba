# User Experience Model

UX-1 sprint: the canonical answer to "what should this person see right
now," derived once from real Firebase Auth claims + Firestore data and
consumed everywhere instead of being re-derived ad hoc per page. This
document is the map; the code (`packages/utils/src/experience/`,
`packages/types/src/experience/`) is the source of truth — if they ever
disagree, trust the code and fix this doc.

This sprint defines the model and a `resolveUserExperience()` entry point
and wires it into one new web hook (`useUserExperience`). It does **not**
redesign any page, add route-guard redirects, or touch Booking — see
"What this sprint intentionally does not do" at the bottom.

## Role model (unchanged, audited not replaced)

Seven platform roles already exist in `packages/types/src/authentication`
and are documented in [authentication.md](./authentication.md) and
[rbac.md](./rbac.md): `passenger`, `driver`, `dispatcher`, `support`,
`moderator`, `admin`, `super_admin`. `ROLE_PERMISSIONS`/`ROLE_HIERARCHY` in
`packages/utils/src/authentication/rbac.ts` are the one and only
permission matrix — this sprint's capability model calls into it
(`hasAnyPermission`) rather than inventing a second one.

One confirmed, documented gap this sprint does not fix: `activateApplication()`
(`packages/firebase` driver-application service) never sets a `driver`
custom claim on the user. The `drivers/{uid}` Firestore record is the only
real signal that someone is an activated driver — see "Priority rules"
below.

## Lifecycle model (new: separated from Role)

A driver applicant is **not** yet a Driver. A user can be a Passenger while
progressing through driver-application states, and an activated Driver
still retains passenger capability. `DriverLifecycleState`
(`packages/types/src/experience/experience.types.ts`) captures the driver
journey independently of `Role`:

```ts
type DriverLifecycleState =
  | { stage: "none" }
  | { stage: "applicant"; status: DriverApplicationStatus }
  | { stage: "active" }
  | { stage: "suspended" }
  | { stage: "inactive" };
```

`resolveDriverLifecycleState()` derives this from the same two Firestore
records the effective-experience resolver uses (`driverApplications`,
`drivers`) — never a third, parallel status field.

## `ExperienceState` — the flat, UI-facing state

`packages/types/src/experience/experience.enums.ts`. This is the single
enum every page switches on for "what do I render." It is intentionally
**not** the same thing as `Role` or `DriverLifecycleState` — see the
enum's own doc comment.

| Value                                                                           | Meaning                                                                                                                                   |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `guest`                                                                         | Not signed in                                                                                                                             |
| `passenger`                                                                     | Signed in, no driver application or driver record                                                                                         |
| `driver_applicant_draft`                                                        | Application started, not submitted                                                                                                        |
| `driver_applicant_submitted`                                                    | Submitted, awaiting review                                                                                                                |
| `driver_applicant_documents_pending`                                            | Under review: documents stage                                                                                                             |
| `driver_applicant_background_check`                                             | Under review: background check stage                                                                                                      |
| `driver_applicant_vehicle_inspection`                                           | Under review: vehicle inspection stage                                                                                                    |
| `driver_applicant_interview`                                                    | Under review: interview stage                                                                                                             |
| `driver_applicant_action_required`                                              | Reserved — not yet reachable (no admin action sets this `DriverApplicationStatus` yet; defined now to avoid a breaking enum change later) |
| `driver_applicant_approved`                                                     | Approved, awaiting activation                                                                                                             |
| `driver_applicant_rejected`                                                     | Rejected                                                                                                                                  |
| `driver_active`                                                                 | Real `drivers/{uid}` record, `status: active`                                                                                             |
| `driver_suspended`                                                              | Real `drivers/{uid}` record, `status: suspended`                                                                                          |
| `driver_inactive`                                                               | Real `drivers/{uid}` record, `status: terminated`                                                                                         |
| `admin`, `super_admin`, `dispatcher`, `support`, `content_manager`, `moderator` | Staff claim — application/driver data is irrelevant to these                                                                              |

`content_manager` and `moderator` were not in this sprint's example list
but are real, reachable `Role`s already admitted into the Admin dashboard
shell (`apps/admin/src/components/RoleGuard.tsx`'s `ADMIN_DASHBOARD_ROLES`).
Omitting them from the enum would have silently resolved a moderator's
claim to `passenger` — an audit-driven correction, not scope creep.

## Priority rules

`resolveExperienceState()` (`packages/utils/src/experience/resolveExperienceState.ts`),
first match wins:

1. **Staff role claim** (`admin`/`super_admin`/`dispatcher`/`support`/
   `content_manager`/`moderator`) — a staff member's own passenger/driver
   history is irrelevant to which experience they get.
2. **A `drivers/{uid}` record** — the real source of truth for "is this
   person an activated driver," set only by `activateApplication()`. Takes
   priority over both the application doc's own status (which may say
   `activated` but is secondary once the driver record exists) and over
   a `driver` role _claim_ (never actually set — see "Role model" above;
   gating on it would leave every real activated driver resolving as a
   plain passenger).
3. **A `driverApplications` doc**, branched by its real
   `DriverApplicationStatus` (mirrors `DRIVER_APPLICATION_TRANSITIONS` in
   `@the-ride/types`'s `drivers.constants.ts`).
4. **Default**: an authenticated user with neither is a plain `passenger`.

If a `driverApplications` doc has status `activated`/`suspended`/`archived`
but data is inconsistent enough that no `drivers/{uid}` record exists yet
(step 2 didn't match), the resolver falls through to `passenger` rather
than guessing — see "Inconsistent state policy" below for how that gets
surfaced instead of silently hidden.

## `resolveUserExperience()` — the full resolver

`packages/utils/src/experience/resolveUserExperience.ts` is the single
entry point. It composes the flat state above with roles, lifecycle,
capabilities, routing, and navigation:

```ts
interface ResolvedExperience {
  effectiveExperience: ExperienceState;
  roles: Role[];
  primaryRole: Role | null;
  lifecycleState: DriverLifecycleState;
  capabilities: UserCapabilities;
  preferredLandingRoute: string;
  navigationProfile: NavigationProfile;
  blockingReason: string | null;
}
```

Pure and framework-agnostic, like everything it calls: callers fetch the
three inputs (`claims`, `driverApplication`, `driver`) and pass them in.
`apps/web/src/hooks/useExperienceInputs.ts` is the one place in `apps/web`
that does the actual Firebase Auth + Firestore fetching.

**Roles**: staff claims map to a single-role array (`[claims.role]`).
Everyone else is `[passenger]`, with `driver` appended (and made
`primaryRole`) only when a real `drivers/{uid}` record exists — matching
"an activated Driver may still retain Passenger capability."

## Capability model

`packages/utils/src/experience/capabilities.ts`. Derived from
`effectiveExperience` + `primaryRole`, never scattered booleans re-checked
per component:

| Capability                                                      | True when                                                                                                             |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `canUsePassengerExperience` / `canBookRide` / `canScheduleRide` | `passenger`, any driver-applicant state, or any driver state (active/suspended/inactive)                              |
| `canStartDriverApplication`                                     | `passenger` only                                                                                                      |
| `canResumeDriverApplication`                                    | `driver_applicant_draft` only                                                                                         |
| `canViewDriverApplicationStatus`                                | Any driver-applicant state except `draft`                                                                             |
| `canAccessDriverHome`                                           | `driver_active` only                                                                                                  |
| `canGoOnline`                                                   | `driver_active` only                                                                                                  |
| `canViewAdmin`                                                  | Any staff state (mirrors `apps/admin`'s `ADMIN_DASHBOARD_ROLES` — keep both in sync)                                  |
| `canReviewDrivers`                                              | `primaryRole` has any of `driver.approve`/`driver.reject`/`driver.activate` via `hasAnyPermission` (real RBAC matrix) |
| `canManageContent`                                              | `primaryRole` is `content_manager`/`admin`/`super_admin` (role-based: the CMS has no dedicated permission yet)        |
| `canDispatch`                                                   | `primaryRole` has `trip.assign` via `hasAnyPermission`                                                                |

## Route access policy

`packages/utils/src/experience/routePolicy.ts` — **data/decisions only,
not wired into any route guard or redirect yet** (that's UX-2/3).
`evaluateRouteAccess(state, routeKind)` returns
`{ allowed, redirectTo?, reason? }` for `RouteKind`s:
`public | passenger-dashboard | become-a-driver | driver-home | go-online | admin-shell`.

Notable transitions:

- An activated driver (`driver_active`) hitting `become-a-driver` is
  `allowed: true` but carries a `redirectTo` back to their landing route —
  they should see the driver dashboard, not application marketing, and
  must not be able to start a second application.
- `driver-home` is only `allowed` for `driver_active`; anyone else gets a
  `redirectTo` back to their own landing route with a reason distinguishing
  "not yet activated" from "no driver record at all."
- `go-online` requires `driver_active`; suspended/inactive drivers get an
  explicit "not in good standing" reason rather than a generic denial.
- `admin-shell` requires a staff state; everyone else is redirected to
  `/login` (guest) or `/` (anyone else).

## Navigation profiles

`packages/utils/src/experience/navigationProfile.ts` — pure data
(`{ labelKey, href }[]`), no JSX. Consumers render it and call
`t(item.labelKey)` themselves.

- **Guest**: marketing nav (About, Safety, Services, Become a Driver, FAQ, Contact).
- **Passenger**: Book a Ride, Ride History, Saved Places, Notifications, Support.
- **Driver-applicant or driver states**: a single non-duplicated entry
  (`My Application` while an applicant, `Driver Status` once active/
  suspended/inactive) pointing at `/become-a-driver` — the one
  lifecycle-aware page — plus Support. There is no separate Application/
  Status/Documents/Trips/Earnings page yet, so the profile does not
  pretend one exists.
- **Staff**: empty array. `apps/web` has no admin nav to lend them; the
  real Admin app is a separate deployment.

## Preferred landing route

`packages/utils/src/experience/landingRoute.ts` — every value maps to a
route that actually exists in `apps/web` today (verified against
`apps/web/src/app`): `guest → /`, `passenger → /dashboard`, every
driver-applicant/driver state → `/become-a-driver`, every staff state →
`/` (no admin surface inside `apps/web` to send them to).

## Inconsistent-state policy

`resolveUserExperience()`'s `detectInconsistency()` checks the two
data-integrity problems visible from its own inputs (deliberately does
**not** fetch additional data like `users/{uid}` to cross-check
`claims.role` — that stays out of scope for this pure-function pass):

- `driverApplication.status === "activated"` but no `drivers/{uid}`
  record exists — usually a transient window right after activation; if
  persistent, a real bug.
- A `drivers/{uid}` record exists with no linked application at all.

Either sets `blockingReason` to a user-safe, non-null string. Consumers
must **surface** this (e.g. a banner) rather than silently granting or
denying access on it — the resolver never hides an inconsistent state
behind a default-passenger fallback without saying so.

Two other known claim/Firestore mismatches, from the audit, are **not**
flagged as inconsistencies because they are the _expected_, normal shape
of this codebase, not bugs:

- **Driver claim without a `drivers/{uid}` record** — expected, because
  `activateApplication()` never sets the claim (see "Role model"). Case 14
  in the test matrix confirms this resolves cleanly to `passenger`, not an
  error state.
- **`admin`/staff claim vs. `users/{uid}.role` mismatch** — out of scope
  for this pass; would require fetching `users/{uid}` inside the resolver,
  which breaks its pure/no-I/O contract. Flagged here for a future sprint,
  not silently ignored.

## Loading / error / unknown states

`useExperienceInputs()` (`apps/web/src/hooks/useExperienceInputs.ts`)
exposes `status: "loading" | "ready"` explicitly — there is no state where
a consumer is left guessing whether data is still in flight. Both
`useExperienceState` (flat, pre-existing shape) and `useUserExperience`
(rich UX-1 shape) return `loading: true` with every derived field `null`
until `status` is `"ready"`; no infinite loader, no flash of an incorrect
default state.

## Auth transition handling

`useExperienceInputs` re-runs its Firestore fetch whenever `useAuth()`'s
`session` reference changes (sign-in/sign-out) or `refetch()`/`refresh()`
is called explicitly (e.g. after submitting a driver application) — no
full page reload required. This was already the existing pattern in
`useExperienceState`; UX-1 preserves it rather than replacing it.

## Files

| File                                                      | Purpose                                                                                                   |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `packages/types/src/experience/experience.enums.ts`       | `ExperienceState` enum                                                                                    |
| `packages/types/src/experience/experience.types.ts`       | `DriverLifecycleState`, `UserCapabilities`, `ExperienceNavItem`/`NavigationProfile`, `ResolvedExperience` |
| `packages/utils/src/experience/resolveExperienceState.ts` | Flat state resolver + `isDriverApplicantState`/`isDriverState`/`isStaffState`/`hasDriverJourney` helpers  |
| `packages/utils/src/experience/lifecycleState.ts`         | `resolveDriverLifecycleState()`                                                                           |
| `packages/utils/src/experience/capabilities.ts`           | `resolveCapabilities()`                                                                                   |
| `packages/utils/src/experience/navigationProfile.ts`      | `resolveNavigationProfile()`                                                                              |
| `packages/utils/src/experience/landingRoute.ts`           | `getPreferredLandingRoute()`                                                                              |
| `packages/utils/src/experience/routePolicy.ts`            | `evaluateRouteAccess()` (data model, not yet wired into guards)                                           |
| `packages/utils/src/experience/resolveUserExperience.ts`  | Composes all of the above                                                                                 |
| `apps/web/src/hooks/useExperienceInputs.ts`               | Shared Firebase Auth + Firestore fetch                                                                    |
| `apps/web/src/hooks/useExperienceState.ts`                | Pre-existing flat hook, now built on `useExperienceInputs`                                                |
| `apps/web/src/hooks/useUserExperience.ts`                 | New rich hook exposing the full `ResolvedExperience` shape; not yet consumed by any page                  |

## What this sprint intentionally does not do

Per the sprint's explicit constraints:

- **No page redesigns.** `SiteHeader.tsx` and `become-a-driver/page.tsx`
  only received the mechanical enum renames needed to keep compiling
  (`AUTHENTICATED_PASSENGER → PASSENGER`, `DRIVER_ACTIVATED → DRIVER_ACTIVE`).
- **No Booking work.**
- **No route-guard redirects wired up** — `evaluateRouteAccess()` is
  defined and tested but no layout or middleware calls it yet.
- **No second role/status system** — `useUserExperience` reuses the exact
  same `useExperienceInputs` data-fetch and `resolveUserExperience` →
  `resolveExperienceState` resolver chain as the pre-existing
  `useExperienceState`; there are two hook _shapes_, not two sources of
  truth.
- **UX-2 has not started.**
