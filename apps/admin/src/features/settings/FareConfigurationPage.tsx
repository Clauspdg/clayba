"use client";

import { DEFAULT_PLATFORM_SETTINGS } from "@the-ride/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Heading, useTranslation } from "@the-ride/ui";

/**
 * Fare Configuration (Sprint 3, Part 4/7/9). Read-only display of
 * `DEFAULT_PLATFORM_SETTINGS` — same placeholder-auth scope note as
 * `VehicleCategoriesPage`; editing writes through `SettingsRepository.updateGlobal`
 * (`@the-ride/firebase`) once there's a real admin session to authorize it.
 */
export function FareConfigurationPage() {
  const { t } = useTranslation();

  const rows: Array<[string, string]> = [
    [t("admin.fareConfig.commissionRate"), `${(DEFAULT_PLATFORM_SETTINGS.commissionRate * 100).toFixed(0)}%`],
    [t("admin.fareConfig.bookingFee"), `$${DEFAULT_PLATFORM_SETTINGS.bookingFee.toFixed(2)}`],
    [t("admin.fareConfig.serviceFeeRate"), `${(DEFAULT_PLATFORM_SETTINGS.serviceFeeRate * 100).toFixed(0)}%`],
    [t("admin.fareConfig.cancellationFee"), `$${DEFAULT_PLATFORM_SETTINGS.cancellationFee.toFixed(2)}`],
    [t("admin.fareConfig.waitingFeePerMinute"), `$${DEFAULT_PLATFORM_SETTINGS.waitingFeePerMinute.toFixed(2)}`],
    [t("admin.fareConfig.taxRate"), `${(DEFAULT_PLATFORM_SETTINGS.taxRate * 100).toFixed(0)}% (${t("admin.fareConfig.placeholder")})`],
    [t("admin.fareConfig.surgeMultiplier"), `${DEFAULT_PLATFORM_SETTINGS.surgeMultiplierDefault}x (${t("admin.fareConfig.placeholder")})`],
    [t("admin.fareConfig.currency"), DEFAULT_PLATFORM_SETTINGS.currency],
    [t("admin.fareConfig.country"), DEFAULT_PLATFORM_SETTINGS.country],
  ];

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.fareConfiguration")}</Heading>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.fareConfig.title")}</CardTitle>
          <CardDescription>{t("admin.fareConfig.description")}</CardDescription>
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
