"use client";

import { DEFAULT_PLATFORM_SETTINGS } from "@the-ride/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Heading, useTranslation } from "@the-ride/ui";

/**
 * Dispatch Settings (Sprint 3, Part 6/7/9). Read-only display of the
 * config `@the-ride/firebase`'s `DispatchService` actually reads at
 * runtime (`SettingsRepository.getGlobal()`) — same placeholder-auth scope
 * note as the other Sprint 3 admin pages.
 */
export function DispatchSettingsPage() {
  const { t } = useTranslation();

  const rows: Array<[string, string]> = [
    [t("admin.dispatchSettings.searchRadius"), `${DEFAULT_PLATFORM_SETTINGS.searchRadiusKm} km`],
    [t("admin.dispatchSettings.assignmentTimeout"), `${DEFAULT_PLATFORM_SETTINGS.assignmentTimeoutSeconds}s`],
    [t("admin.dispatchSettings.maxDriverOffers"), String(DEFAULT_PLATFORM_SETTINGS.maxDriverOffers)],
  ];

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.dispatchSettings")}</Heading>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dispatchSettings.title")}</CardTitle>
          <CardDescription>{t("admin.dispatchSettings.description")}</CardDescription>
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
    </div>
  );
}
