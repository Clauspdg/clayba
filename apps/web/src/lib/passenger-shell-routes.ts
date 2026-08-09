/**
 * Route prefixes rendered inside `PassengerShell` (User State Experience
 * sprint) — that shell supplies its own complete header/sidebar chrome, so
 * `SiteHeader`/`SiteFooter` must render nothing on these routes. Shared
 * between both so the list can't drift.
 */
export const PASSENGER_SHELL_PREFIXES = [
  "/dashboard",
  "/book",
  "/rides",
  "/wallet",
  "/notifications",
  "/saved-places",
  "/profile",
  "/support",
  "/settings",
];

export function isPassengerShellRoute(pathname: string): boolean {
  return PASSENGER_SHELL_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
