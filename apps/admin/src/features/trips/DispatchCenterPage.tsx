"use client";

import { Heading, Tabs, TabsContent, TabsList, TabsTrigger, useTranslation } from "@the-ride/ui";

import { AssignmentSettingsTab } from "./AssignmentSettingsTab";
import { DispatchStatisticsTab } from "./DispatchStatisticsTab";
import { DriverQueueTab } from "./DriverQueueTab";
import { LiveRideRequestsTab } from "./LiveRideRequestsTab";
import { OfferHistoryTab } from "./OfferHistoryTab";
import { SearchRadiusTab } from "./SearchRadiusTab";

/**
 * Dispatch Center (Sprint 4, Part 10) — one page, six tabs, all reading
 * from the same placeholder-auth / seed-data scope every Sprint 3/4 admin
 * page uses (see `VehicleCategoriesPage`'s scope note): no live Firestore
 * session is wired into the dashboard yet.
 */
export function DispatchCenterPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.dispatchCenter.title")}</Heading>

      <Tabs defaultValue="live-requests">
        <TabsList>
          <TabsTrigger value="live-requests">{t("admin.dispatchCenter.tabs.liveRequests")}</TabsTrigger>
          <TabsTrigger value="driver-queue">{t("admin.dispatchCenter.tabs.driverQueue")}</TabsTrigger>
          <TabsTrigger value="offer-history">{t("admin.dispatchCenter.tabs.offerHistory")}</TabsTrigger>
          <TabsTrigger value="statistics">{t("admin.dispatchCenter.tabs.statistics")}</TabsTrigger>
          <TabsTrigger value="search-radius">{t("admin.dispatchCenter.tabs.searchRadius")}</TabsTrigger>
          <TabsTrigger value="assignment-settings">{t("admin.dispatchCenter.tabs.assignmentSettings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="live-requests">
          <LiveRideRequestsTab />
        </TabsContent>
        <TabsContent value="driver-queue">
          <DriverQueueTab />
        </TabsContent>
        <TabsContent value="offer-history">
          <OfferHistoryTab />
        </TabsContent>
        <TabsContent value="statistics">
          <DispatchStatisticsTab />
        </TabsContent>
        <TabsContent value="search-radius">
          <SearchRadiusTab />
        </TabsContent>
        <TabsContent value="assignment-settings">
          <AssignmentSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
