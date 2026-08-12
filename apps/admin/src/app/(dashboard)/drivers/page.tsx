"use client";

import { DriversPage } from "@/features/drivers";
import { LoadingState, useTranslation } from "@the-ride/ui";
import { Suspense } from "react";

/**
 * `DriversPage` reads `?applicationId=`/`?driverId=` via `useSearchParams()`
 * (Admin Driver Application Review Workspace sprint, Part 3) — Next's
 * static export requires that hook's nearest page tree to have a Suspense
 * boundary, same reasoning as `apps/web`'s `/login` page.
 */
export default function Page() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<LoadingState title={t("common.loading")} />}>
      <DriversPage />
    </Suspense>
  );
}
