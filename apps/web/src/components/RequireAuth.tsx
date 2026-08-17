"use client";

import { LoadingState, useTranslation } from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

/**
 * BOOKING-01 fix — isolates `useSearchParams()` in its own component so the
 * Suspense boundary it requires for static export stays internal to
 * `RequireAuth`; every existing consumer (`PassengerShell`,
 * `RequireDriverAccess`, `/book` directly) keeps working unchanged.
 */
function RedirectToLogin() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve where the visitor was actually headed (e.g. /book?pickup=...)
    // instead of always bouncing to a bare /login that forgets it, so
    // signing in returns them to it.
    const query = searchParams.toString();
    const intended = query ? `${pathname}?${query}` : pathname;
    router.replace(`/login?next=${encodeURIComponent(intended)}`);
  }, [router, pathname, searchParams]);

  return null;
}

/** Gates a web page behind a signed-in session — no role restriction, unlike admin's `RoleGuard` (any authenticated user may view their own profile). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { status } = useAuth();

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        {status === "unauthenticated" && (
          <Suspense fallback={null}>
            <RedirectToLogin />
          </Suspense>
        )}
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  return <>{children}</>;
}
