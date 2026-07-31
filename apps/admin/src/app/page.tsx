"use client";

import { Card, CardContent, CardHeader, CardTitle, Heading, Text, useTranslation } from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";

export default function AdminHomePage() {
  const { t } = useTranslation();
  const { session } = useAuth();

  const summaryCards = [
    t("admin.sidebar.drivers"),
    t("admin.sidebar.passengers"),
    t("admin.sidebar.trips"),
    t("admin.sidebar.payments"),
    t("admin.sidebar.wallet"),
    t("admin.sidebar.reports"),
    t("admin.sidebar.support"),
    t("admin.sidebar.analytics"),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading level={2}>{t("admin.dashboard.title")}</Heading>
        {session && (
          <Text tone="muted">
            {t("admin.dashboard.welcomeBack")}, {session.displayName ?? session.email}
          </Text>
        )}
      </div>
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4">
        {summaryCards.map((title) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("admin.placeholderCard.comingSoon")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
