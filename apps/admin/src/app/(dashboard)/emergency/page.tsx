"use client";

import { SosIncidentsTab } from "@/features/emergency/SosIncidentsTab";
import { Heading, useTranslation } from "@the-ride/ui";

export default function EmergencyPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.emergency")}</Heading>
      <SosIncidentsTab />
    </div>
  );
}
