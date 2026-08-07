"use client";

import { Heading, Tabs, TabsContent, TabsList, TabsTrigger, useTranslation } from "@the-ride/ui";

import { ActiveDriversTab } from "./ActiveDriversTab";
import { ApplicationsTab } from "./ApplicationsTab";

/**
 * Real Drivers page (Web Phase W1, Parts 5-6) — live Firestore-backed
 * applications review + active driver management, replacing the earlier
 * `PlaceholderDashboardPage`.
 */
export function DriversPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.drivers")}</Heading>

      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">{t("admin.drivers.applicationsTab")}</TabsTrigger>
          <TabsTrigger value="active">{t("admin.drivers.activeDriversTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <ApplicationsTab />
        </TabsContent>
        <TabsContent value="active">
          <ActiveDriversTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
