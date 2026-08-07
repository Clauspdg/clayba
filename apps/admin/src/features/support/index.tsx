"use client";

import { Heading, Tabs, TabsContent, TabsList, TabsTrigger, useTranslation } from "@the-ride/ui";

import { ContactSubmissionsTab } from "./ContactSubmissionsTab";
import { SupportTicketsTab } from "./SupportTicketsTab";

/**
 * Real Support page (Web Phase W1, Parts 5-6) — live Firestore-backed
 * support ticket + contact submission management, replacing the earlier
 * `PlaceholderDashboardPage`.
 */
export function SupportPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.support")}</Heading>

      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets">{t("admin.support.supportTicketsTab")}</TabsTrigger>
          <TabsTrigger value="contact">{t("admin.support.contactSubmissionsTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <SupportTicketsTab />
        </TabsContent>
        <TabsContent value="contact">
          <ContactSubmissionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
