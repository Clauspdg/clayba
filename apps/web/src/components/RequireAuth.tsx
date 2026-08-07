"use client";

import { LoadingState, useTranslation } from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/** Gates a web page behind a signed-in session — no role restriction, unlike admin's `RoleGuard` (any authenticated user may view their own profile). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  return <>{children}</>;
}
