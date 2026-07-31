"use client";

import { useTranslation } from "@the-ride/ui";

import { PlaceholderDashboardPage } from "@/components/PlaceholderDashboardPage";

export function AnalyticsPage() {
  const { t } = useTranslation();
  return <PlaceholderDashboardPage title={t("admin.sidebar.analytics")} />;
}
