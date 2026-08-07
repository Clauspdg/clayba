/**
 * Next.js `template.tsx` (Sprint 6 — public website redesign): unlike
 * `layout.tsx`, this re-mounts on every navigation, which is what makes a
 * lightweight per-page fade-in transition possible without a JS animation
 * library (framer-motion isn't installed — the brief says to fall back to
 * CSS animation, this is that fallback, applied globally at the root
 * template rather than duplicated per page).
 */
export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
