# UX Simplification — Passenger, Driver & Admin

Sprint goal: reduce cognitive load across the three experiences by giving every
screen one primary goal and one primary call-to-action, with secondary
information regrouped into navigation or progressive disclosure rather than
shown at equal weight. **No routes or capabilities were removed** — every
control that existed before this sprint is still reachable, just relocated.

## 1. UX problems found (audit)

- **Passenger Dashboard** carried six cards at equal visual weight (Wallet,
  Saved Places, Recent Trips, Messages, driver-entry promo, current-ride) —
  a passenger opening the app to check a ride status had to scan past five
  unrelated cards first.
- **Passenger sidebar** was a flat list mixing account management, support,
  and core trip actions with no grouping.
- **Driver Home** rendered up to five cards simultaneously (online toggle,
  pending offer, current ride, vehicle summary, today's earnings) regardless
  of which one was operationally relevant. A driver with an incoming ride
  offer saw it with the same weight as their vehicle's inspection date.
- **Driver Home** and every other `/driver/*` page duplicated the driver's
  status: once in `DriverHeader` (persistent, every page) and again as a
  `DriverStatusBadge` in the page's own title row.
- **Driver sidebar** grouped by data type (Rides/Finance/Driver) rather than
  by how often a driver actually uses each item.
- **Admin Dashboard** showed eight equally-weighted cards: four generic
  entity counts (drivers/passengers/trips/tickets, none of them time-
  sensitive) and four bare link cards with no data behind them at all —
  nothing told an admin what needed a decision _right now_.
- **Admin sidebar** was a flat 17-item list with no grouping, so operational
  tools (Dispatch, Trips), people-management, finance, and system settings
  all competed for attention at the same level.

## 2. Passenger Dashboard — before/after

**Before:** Welcome header, current-ride card, Wallet balance card, Saved
Places card, Recent Trips list, Messages preview, and a `DriverEntryCard`
promo — six to seven cards in the primary view.

**After:** Welcome header, an unread-notifications banner (only when
relevant), and exactly one primary card: the current ride if one exists,
otherwise a single "Book a ride" call-to-action. Wallet, Saved Places,
Notifications, and Profile moved into the sidebar's Account group (Part 3).
`DriverEntryCard` was removed from the dashboard body — its function (get to
the Driver Space) is fully preserved via the sidebar's Driver footer group.

## 3. Passenger navigation — before/after

**Before:** Flat list — Dashboard, Book, Rides, Wallet, Saved Places,
Notifications, Profile, Support, Settings — plus a separate Driver footer
group.

**After:** Three labeled groups using the shared `Sidebar` `groups` prop:

- **Main** — Dashboard, Book a Ride, My Rides
- **Account** — Wallet, Saved Places, Notifications, Profile
- **Support** — Support, Settings

The Driver footer group is unchanged. Every route from the "before" list is
still present — only the grouping changed.

## 4. Driver Home — before/after

**Before:** Up to five simultaneous cards (online control, pending offer,
current ride, vehicle, today's earnings/stats) with no precedence — all
visible at once whenever their data existed, plus a duplicated status badge
in the page title.

**After:** State-driven, single primary card, chosen by real precedence:

1. **Pending ride offer** (if any) — outranks everything else.
2. **Current trip** (if any, and no offer) — status badge + "Current Ride" CTA.
3. **Idle state** — online-and-waiting message, or a disabled "Go Online"
   control with the specific blocking reasons, whichever applies.

Vehicle summary and earnings/stats no longer render on Driver Home at all —
they're "manage X" concerns that belong on their own nav pages (Vehicle,
Earnings), not a dashboard competing with operational state. The redundant
`DriverStatusBadge` in the page title was removed from both the active and
restricted (suspended/inactive) states, since `DriverHeader` already shows
status persistently on every driver page (Part 6). An expiring-documents
warning still surfaces as a lightweight alert above the primary card when
relevant — it wasn't dropped, just demoted from a full card to a banner.

## 5. Driver navigation — before/after

**Before:** Groups by data type — Home, Rides (Requests/Current/History),
Finance (Earnings/Wallet), Driver (Vehicle/Documents/Performance/Account),
plus Support.

**After:** Groups by usage frequency:

- **Main** — Driver Home, Ride Requests, Current Ride
- **Activity** — Trips, Earnings
- **Account** — Vehicle, Documents, Performance, Account
- **Support** — Support

Every route is unchanged; only the grouping and group labels changed.

## 6. Admin Dashboard — before/after

**Before:** Eight cards at equal weight — four generic counts (active
drivers, passengers, total trips, open tickets) that rarely demand same-day
action, and four bare navigation cards (Payments, Wallet, Analytics,
Support) with no data displayed at all.

**After:** Three tiers:

1. **Top tier** (4 cards, prominent grid) — Active Rides, Drivers Online,
   Pending Applications, Critical Alerts. Each links to the relevant
   workspace and is a real Firestore aggregation count, not a static link.
2. **Recent Pending Applications** — a real preview list (name + status
   badge) of applications actually waiting on a decision, with a "View"
   link to the full Drivers workspace, replacing the old empty link cards.
3. **Quick links** — Payments, Wallet, Analytics, Support demoted to a
   single row of small pill-style chips rather than full cards, since they
   aren't time-sensitive on every visit.

"Critical Alerts" is an honest composite (open URGENT/HIGH support tickets +
open SAFETY-category reports) built from collections that already exist —
nothing was fabricated. Detailed breakdowns remain on their own dedicated
pages (Analytics, Reports), consistent with "move detailed reports to
dedicated pages."

## 7. Admin navigation — before/after

**Before:** Flat 17-item list with no grouping.

**After:** Six labeled groups:

- **Overview** — Dashboard
- **Operations** — Dispatch Center, Trips, Dispatch Settings, Vehicle
  Categories, Fare Configuration
- **People** — Drivers, Passengers, Users
- **Finance** — Payments, Wallet
- **Safety & Support** — Reports, Support
- **System** — Analytics, Audit Logs, Permissions, Settings

Content Management stays as the existing footer group, unchanged. All 17
original items are still reachable — only the grouping changed.

## 8. Cards removed, moved, or summarized

- **Removed from a page body** (relocated elsewhere, not deleted):
  `DriverEntryCard` on Passenger Dashboard → sidebar Driver footer group.
  Wallet/Saved Places/Recent Trips/Messages cards → sidebar Account group /
  their own existing pages.
  Vehicle & today's-earnings cards on Driver Home → Vehicle and Earnings
  nav pages.
  Duplicated `DriverStatusBadge` → removed outright (true duplicate of
  `DriverHeader`, not a relocation).
- **Summarized:** Admin's four generic entity-count cards replaced by four
  operationally-relevant counts; four empty link cards summarized into one
  data-bearing "recent applications" list plus a row of quick-link chips.

## 9. CTA hierarchy changes

- Passenger Dashboard: single primary CTA — "Book a ride" (idle) or "View
  details" (active ride) — everything else is a nav link, not a button.
- Driver Home: single primary CTA per state — "Ride Requests" (offer),
  "Current Ride" (active trip), or a disabled "Go Online" control with its
  blocking reasons inline (idle). No competing secondary buttons on the page.
- Admin Dashboard: no page-level primary button — the top-tier cards and
  recent-applications list are themselves the entry points, consistent with
  a dashboard whose job is triage, not a single task.

## 10. Responsive improvements

All touched screens reuse the project's existing breakpoint set (phone
320–430px, tablet 768–1024px, laptop/desktop 1280px+). The Admin Dashboard's
new top tier collapses via `grid-cols-1` → `tablet:grid-cols-2` →
`laptop:grid-cols-4`, matching the pattern already used elsewhere in Admin.
Passenger Dashboard and Driver Home were already single-column, max-width
containers pre-sprint and remain so — removing competing cards reduces
vertical scroll length on phone without changing the layout mechanism.
Sidebar grouping uses the same `Sidebar`/`groups` rendering already
responsive (drawer on phone/tablet, fixed rail on desktop) from its prior
introduction — no new responsive code was needed for navigation.

## 11. Functionality preserved

Every route, page, and action that existed before this sprint is still
reachable:

- Passenger: Wallet, Saved Places, Notifications, Profile, Support, Settings
  — all still full pages, reachable from the sidebar's Account/Support
  groups instead of dashboard cards.
- Driver: Vehicle, Documents, Performance, Account, Trips, Earnings, Support
  — all still full pages, reachable from the sidebar's Account/Activity
  groups instead of Driver Home cards.
- Admin: all 17 original nav destinations remain, now grouped; Payments,
  Wallet, Analytics, Support remain reachable via quick-link chips in
  addition to the sidebar.
  No Firestore schema, permission, or business-logic change was made — this
  sprint is UI-layer only.

## 12. Files modified

- `apps/web/src/components/PassengerSidebar.tsx`
- `apps/web/src/app/(passenger)/dashboard/page.tsx`
- `apps/web/src/app/(driver)/driver/page.tsx`
- `apps/web/src/components/DriverSidebar.tsx`
- `apps/admin/src/components/AdminSidebar.tsx`
- `apps/admin/src/lib/dashboard-admin.ts`
- `apps/admin/src/app/page.tsx`
- `firestore.indexes.json`
- `packages/hooks/src/i18n/locales/en.ts`
- `packages/hooks/src/i18n/locales/fr.ts`
- `docs/ux-simplification.md` (this file)

## 13. Tests

No new pure-function logic was introduced by this sprint (`getOperationalSummary`
and `getRecentPendingApplications` are thin Firestore-query wrappers, consistent
with this repo's existing convention of unit-testing pure functions only —
see `driver-admin.test.ts` for the pattern this follows). Existing test
suites (`pnpm test`) were run unchanged to confirm no regression.

## 14. Quality gates

`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build:web`, and
`pnpm build:admin` — see commit for the exact pass/fail state recorded at
commit time.

## 15. Commit

See git log for the exact commit hash containing this sprint's changes.

## 16. Components deployed

Web (DEV) and Admin (DEV) hosting targets; Firestore composite indexes
(`supportTickets: status+priority`, `reports: status+category`) deployed
ahead of the app code since the new Admin Dashboard queries depend on them.

## 17. Live URLs

- `https://the-ride-web-dev.web.app`
- `https://the-ride-admin-dev.web.app`

## 18. Remaining UX concerns

- Admin's "Critical Alerts" composite currently only covers urgent/high
  support tickets and open safety reports — as the platform grows, this may
  warrant a dedicated alerts/incident collection rather than a computed
  composite.
- Driver Home's idle "waiting for requests" state is currently static text;
  a future sprint could surface live nearby-demand signals if the dispatch
  engine exposes them.
- Passenger Dashboard's unread-notifications banner is a single aggregate
  count; grouping by notification type could reduce a "click to find out
  what it is" step for passengers with multiple unread categories.

## 19. Status

This sprint's implementation is complete as documented above. See the
session's final report for the exact quality-gate results, commit hash, and
live-verification outcome that determine whether this sprint is CLOSED.
