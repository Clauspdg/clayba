/**
 * BOOKING-03 — guards every `?next=` consumer (`/login`, `/register`,
 * `/verify-email`) against open-redirect: a crafted link like
 * `/login?next=https://evil.com` (or `//evil.com`, a protocol-relative URL
 * browsers still treat as external) must never be honored. Only a path
 * that stays on this site is safe to use as a post-auth destination.
 */
export function isSafeInternalPath(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.startsWith("/\\")) return false;
  if (value.includes("://")) return false;
  return true;
}
