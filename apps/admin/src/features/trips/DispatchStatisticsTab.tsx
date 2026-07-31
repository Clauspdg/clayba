"use client";

import { Card, CardContent, useTranslation } from "@the-ride/ui";

export function DispatchStatisticsTab() {
  const { t } = useTranslation();

  const stats = [
    t("admin.dispatchStatistics.averageMatchTime"),
    t("admin.dispatchStatistics.acceptanceRate"),
    t("admin.dispatchStatistics.averageRadiusExpansions"),
    t("admin.dispatchStatistics.noDriverRate"),
    t("admin.dispatchStatistics.averageOfferScore"),
    t("admin.dispatchStatistics.reassignmentRate"),
  ];

  return (
    <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
      {stats.map((label) => (
        <Card key={label}>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">—</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
