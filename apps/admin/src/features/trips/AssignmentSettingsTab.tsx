"use client";

import { DEFAULT_PLATFORM_SETTINGS } from "@the-ride/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, useTranslation } from "@the-ride/ui";

/** Assignment Settings (Sprint 4, Part 3/6/10) — the matching engine's eligibility thresholds and offer timer. */
export function AssignmentSettingsTab() {
  const { t } = useTranslation();

  const rows: Array<[string, string]> = [
    [t("admin.assignmentSettings.offerTimeout"), `${DEFAULT_PLATFORM_SETTINGS.assignmentTimeoutSeconds}s`],
    [t("admin.assignmentSettings.maxDriverOffers"), String(DEFAULT_PLATFORM_SETTINGS.maxDriverOffers)],
    [t("admin.assignmentSettings.minDriverScore"), String(DEFAULT_PLATFORM_SETTINGS.minDriverScore)],
    [t("admin.assignmentSettings.minAcceptanceRate"), `${(DEFAULT_PLATFORM_SETTINGS.minAcceptanceRate * 100).toFixed(0)}%`],
    [t("admin.assignmentSettings.maxCancellationRate"), `${(DEFAULT_PLATFORM_SETTINGS.maxCancellationRate * 100).toFixed(0)}%`],
    [t("admin.assignmentSettings.maxActiveJobs"), String(DEFAULT_PLATFORM_SETTINGS.maxActiveJobsPerDriver)],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.assignmentSettings.title")}</CardTitle>
        <CardDescription>{t("admin.assignmentSettings.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 tablet:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between border-b border-neutral-100 py-2 dark:border-neutral-800">
              <dt className="text-sm text-neutral-500 dark:text-neutral-400">{label}</dt>
              <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
