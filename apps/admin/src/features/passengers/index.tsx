"use client";

import { Heading, useTranslation } from "@the-ride/ui";

import { PassengersTab } from "./PassengersTab";

/**
 * Real Passengers page (Web Phase W1, Parts 5-6) — live Firestore-backed
 * list of `users` documents with `role === "passenger"`, replacing the
 * earlier `PlaceholderDashboardPage`.
 */
export function PassengersPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.passengers")}</Heading>
      <PassengersTab />
    </div>
  );
}
