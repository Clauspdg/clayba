/**
 * Route prefixes rendered inside `PassengerShell`/`DriverShell` — each shell
 * supplies its own complete header/sidebar chrome, so `SiteHeader`/
 * `SiteFooter` must render nothing on these routes. Shared between both so
 * the list can't drift.
 *
 * UX-3 sprint (Dedicated Driver Space) — audit fix: `/driver` was missing
 * from this list when the Driver Space shipped, so `SiteHeader`/`SiteFooter`
 * kept rendering above/below `DriverShell`'s own header/sidebar on every
 * `/driver/*` page (a real, visible double-header/double-footer, caught in
 * a follow-up audit, not by the sprint's own QA — none of it checked for an
 * UNEXPECTED extra header, only that the real one was correct).
 */
export const APP_SHELL_ROUTE_PREFIXES = [
  "/dashboard",
  "/book",
  "/rides",
  "/wallet",
  "/notifications",
  "/saved-places",
  "/profile",
  "/support",
  "/settings",
  "/driver",
];

export function isAppShellRoute(pathname: string): boolean {
  return APP_SHELL_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
