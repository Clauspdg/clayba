"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { getDashboardCounts, type DashboardCounts } from "@/lib/dashboard-admin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  Heading,
  LoadingState,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import Link from "next/link";
import { useEffect, useState } from "react";

const LINK_CARDS = [
  { key: "payments", href: "/payments" },
  { key: "wallet", href: "/wallet" },
  { key: "reports", href: "/reports" },
  { key: "analytics", href: "/analytics" },
] as const;

export default function AdminHomePage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardCounts(adminFirestore)
      .then((result) => {
        if (!cancelled) setCounts(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

      {error ? (
        <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />
      ) : (
        <div className="tablet:grid-cols-2 laptop:grid-cols-4 grid gap-4">
          {(
            [
              { title: t("admin.sidebar.drivers"), value: counts?.activeDrivers, href: "/drivers" },
              {
                title: t("admin.sidebar.passengers"),
                value: counts?.passengers,
                href: "/passengers",
              },
              { title: t("admin.sidebar.trips"), value: counts?.trips, href: "/trips" },
              { title: t("admin.sidebar.support"), value: counts?.openTickets, href: "/support" },
            ] as const
          ).map((card) => (
            <Link key={card.title} href={card.href}>
              <Card className="hover:border-brand transition-colors">
                <CardHeader>
                  <CardTitle>{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {counts === null && !error ? (
                    <LoadingState title={t("common.loading")} />
                  ) : (
                    <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                      {card.value}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}

          {LINK_CARDS.map((card) => (
            <Link key={card.key} href={card.href}>
              <Card className="hover:border-brand transition-colors">
                <CardHeader>
                  <CardTitle>{t(`admin.sidebar.${card.key}`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t("admin.dashboardCounts.view")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
