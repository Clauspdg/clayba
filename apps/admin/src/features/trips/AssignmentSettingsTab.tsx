"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { subscribeGlobalSettings } from "@/lib/settings-admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingState,
  useTranslation,
} from "@the-ride/ui";
import { DEFAULT_PLATFORM_SETTINGS, type PlatformSettings } from "@the-ride/types";
import { useEffect, useState } from "react";

/**
 * Assignment Settings (Sprint 4, Part 3/6/10; wired live in Web Phase W1)
 * — read-only view of the matching engine's eligibility thresholds and
 * offer timer, now read from `settings/global` (edited from the
 * "Dispatch Settings" sidebar page) rather than hardcoded defaults.
 */
export function AssignmentSettingsTab() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<PlatformSettings | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeGlobalSettings(adminFirestore, setSettings, setError);
  }, []);

  if (error) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />;
  }

  if (settings === undefined) {
    return <LoadingState title={t("common.loading")} />;
  }

  const values = settings ?? DEFAULT_PLATFORM_SETTINGS;

  const rows: Array<[string, string]> = [
    [t("admin.assignmentSettings.offerTimeout"), `${values.assignmentTimeoutSeconds}s`],
    [t("admin.assignmentSettings.maxDriverOffers"), String(values.maxDriverOffers)],
    [t("admin.assignmentSettings.minDriverScore"), String(values.minDriverScore)],
    [
      t("admin.assignmentSettings.minAcceptanceRate"),
      `${(values.minAcceptanceRate * 100).toFixed(0)}%`,
    ],
    [
      t("admin.assignmentSettings.maxCancellationRate"),
      `${(values.maxCancellationRate * 100).toFixed(0)}%`,
    ],
    [t("admin.assignmentSettings.maxActiveJobs"), String(values.maxActiveJobsPerDriver)],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.assignmentSettings.title")}</CardTitle>
        <CardDescription>{t("admin.assignmentSettings.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="tablet:grid-cols-2 grid gap-4">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-neutral-100 py-2 dark:border-neutral-800"
            >
              <dt className="text-sm text-neutral-500 dark:text-neutral-400">{label}</dt>
              <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
