/**
 * CLAYBA P1.1, section 7 — `SiteFooter.tsx`'s existing dev-build marker
 * (`NEXT_PUBLIC_BUILD_COMMIT`/`NEXT_PUBLIC_BUILD_DATE`, baked in at build
 * time by `next.config.ts`) never renders on app-shell routes at all
 * (`SiteFooter` returns `null` for `/dashboard`, `/driver`, etc. —
 * `isAppShellRoute`), which is exactly where this sprint's "prove the
 * browser is loading the latest build" concern actually lives. Same real
 * env vars, no new mechanism — just made visible where it was missing.
 */
export function DevBuildBadge() {
  if (process.env.NEXT_PUBLIC_APP_ENV !== "development") return null;

  return (
    <div className="fixed bottom-2 left-2 z-50 rounded-md border border-dashed border-neutral-300 bg-white/90 px-2 py-1 font-mono text-[10px] text-neutral-400 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-600">
      DEV BUILD {process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "unknown"}
      {process.env.NEXT_PUBLIC_BUILD_DATE &&
        ` — ${process.env.NEXT_PUBLIC_BUILD_DATE.replace("T", " ").slice(0, 16)}`}
    </div>
  );
}
