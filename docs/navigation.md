# Navigation (Sprint 2)

Every screen/page below is a real route with real (translated) content, but
no business logic — see the "Strict Rules" in the sprint brief (no ride
requests, trips, maps, payments, driver-approval logic).

## apps/web (Next.js — public website)

All pages share one root layout (`SiteHeader` + `SiteFooter`, wired in
`src/app/layout.tsx`).

```
/                       Landing (src/app/page.tsx)
/about                  (marketing)/about
/safety                 (marketing)/safety
/services               (marketing)/services
/become-a-driver        (marketing)/become-a-driver
/faq                    (marketing)/faq
/contact                (marketing)/contact
/privacy-policy         (marketing)/privacy-policy
/terms-of-service       (marketing)/terms-of-service
*                       not-found.tsx (404)
```

The landing page stays at `src/app/page.tsx` (not inside the `(marketing)`
route group) specifically to avoid a duplicate-route conflict — see
[ui-architecture.md](./ui-architecture.md).

## apps/admin (Next.js — operations dashboard)

Two shells, chosen by `AdminShell` based on the current path: the login
page renders with no chrome; everything else gets `RoleGuard` + `Sidebar` +
`Header`.

```
/login                          (auth)/login — no sidebar/header
/                                Dashboard Home
/drivers                         (dashboard)/drivers
/passengers                      (dashboard)/passengers
/trips                           (dashboard)/trips
/payments                        (dashboard)/payments
/wallet                          (dashboard)/wallet
/reports                         (dashboard)/reports
/support                         (dashboard)/support
/settings                        (dashboard)/settings
/analytics                       (dashboard)/analytics
```

Each dashboard page renders placeholder cards only (Part 6: "No CRUD
yet") via the shared `PlaceholderDashboardPage` component. Page content
itself lives in `src/features/<domain>/index.tsx`, matching the
domain-first convention from Sprint 0's `docs/architecture/ARCHITECTURE.md`
— the route file under `src/app/(dashboard)/<domain>/page.tsx` just
re-exports it.

## apps/driver-app (Expo Router)

```
/ (index)              Splash — auto-navigates to /welcome
/welcome               Welcome
/login                 Login
/register              Register
/become-driver         Become Driver
/driver-application    Driver Application
/upload-documents      Upload Documents
/application-status    Application Status (shows a static DriverApplicationStatus from @the-ride/types)
/profile               Profile
/settings              Settings (theme + language switching, links to Help)
/help                  Help
```

## apps/passenger-app (Expo Router)

```
/ (index)              Splash — auto-navigates to /welcome
/welcome               Welcome
/login                 Login
/register              Register
/forgot-password       Forgot Password
/verify-email          Verify Email
/create-profile        Create Profile
/settings               Settings — hub linking to the five below
/language               Language
/notifications           Notifications (push/email/SMS toggles — UI only)
/help                    Help
/privacy                 Privacy
/terms                   Terms
```

## What's intentionally not here

No ride booking, no maps, no payment flows, no driver-approval logic — the
mobile apps' auth screens don't call Firebase yet (there's no session to
route on), and admin's login doesn't authenticate against anything real.
See [ui-architecture.md](./ui-architecture.md) for what's stubbed and why.

## Related Docs

- [UI Architecture](./ui-architecture.md)
- [Design System](./design-system.md)
