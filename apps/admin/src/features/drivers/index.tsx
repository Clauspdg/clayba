"use client";

import { Heading, Tabs, TabsContent, TabsList, TabsTrigger, useTranslation } from "@the-ride/ui";
import { useRouter, useSearchParams } from "next/navigation";

import { ActiveDriversTab } from "./ActiveDriversTab";
import { ApplicationReviewWorkspace } from "./ApplicationReviewWorkspace";
import { ApplicationsTab } from "./ApplicationsTab";
import { DriverDetailWorkspace } from "./DriverDetailWorkspace";

/**
 * Real Drivers page (Web Phase W1, Parts 5-6) — live Firestore-backed
 * applications review + active driver management, replacing the earlier
 * `PlaceholderDashboardPage`.
 *
 * Admin Driver Application Review Workspace sprint, Part 3 — `apps/admin`
 * is a static export (`output: "export"`, see `next.config.ts`), so a
 * true dynamic `/drivers/applications/[applicationId]` route can't be
 * pre-rendered for arbitrary future application IDs. `?applicationId=`/
 * `?driverId=` on this same route gives the same real, bookmarkable,
 * shareable, browser-back-button-compatible URL
 * (`/drivers?applicationId=OYuxO8MvrKr8sYT0qsPP`) without that constraint
 * — this component just decides, from the URL, whether to show the
 * table view or a workspace over it.
 */
export function DriversPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const driverId = searchParams.get("driverId");

  function openApplication(id: string) {
    router.push(`/drivers?applicationId=${encodeURIComponent(id)}`);
  }

  function openDriver(id: string) {
    router.push(`/drivers?driverId=${encodeURIComponent(id)}`);
  }

  function backToList() {
    router.push("/drivers");
  }

  if (applicationId) {
    return (
      <div className="flex flex-col gap-6">
        <ApplicationReviewWorkspace applicationId={applicationId} onBack={backToList} />
      </div>
    );
  }

  if (driverId) {
    return (
      <div className="flex flex-col gap-6">
        <DriverDetailWorkspace
          driverId={driverId}
          onBack={backToList}
          onViewApplication={openApplication}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.drivers")}</Heading>

      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">{t("admin.drivers.applicationsTab")}</TabsTrigger>
          <TabsTrigger value="active">{t("admin.drivers.activeDriversTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <ApplicationsTab onView={openApplication} />
        </TabsContent>
        <TabsContent value="active">
          <ActiveDriversTab onView={openDriver} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
