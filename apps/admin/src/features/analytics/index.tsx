"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { getAnalyticsSummary, type AnalyticsSummary } from "@/lib/dashboard-admin";
import { Card, CardContent, ErrorState, Heading, LoadingState, useTranslation } from "@the-ride/ui";
import { useEffect, useState } from "react";

/**
 * Analytics (Web Phase W1, Parts 5-6) — platform-wide totals computed live
 * from Firestore aggregation queries, replacing the earlier
 * `PlaceholderDashboardPage`. No charting library wired in — these are
 * real numbers, not a fabricated chart, which is the honest scope for
 * this pass (see final report's disclosed limitations).
 */
export function AnalyticsPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAnalyticsSummary(adminFirestore)
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />;
  }

  if (summary === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  const cards: Array<[string, string]> = [
    [t("admin.analyticsPage.activeDrivers"), String(summary.activeDrivers)],
    [t("admin.analyticsPage.passengers"), String(summary.passengers)],
    [t("admin.analyticsPage.totalTrips"), String(summary.totalTrips)],
    [t("admin.analyticsPage.openTickets"), String(summary.openTickets)],
    [t("admin.analyticsPage.openReports"), String(summary.openReports)],
    [t("admin.analyticsPage.totalRevenue"), `$${summary.totalRevenue.toFixed(2)}`],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading level={2}>{t("admin.analyticsPage.title")}</Heading>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t("admin.analyticsPage.description")}
        </p>
      </div>

      <div className="tablet:grid-cols-2 laptop:grid-cols-3 grid gap-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                {value}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
