"use client";

import { useTranslation } from "@the-ride/ui";

import { PlaceholderDashboardPage } from "@/components/PlaceholderDashboardPage";

export function SettingsPage() {
  const { t } = useTranslation();
  return <PlaceholderDashboardPage title={t("admin.sidebar.settings")} />;
}
