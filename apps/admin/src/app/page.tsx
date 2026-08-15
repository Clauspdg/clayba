"use client";

import { adminFirestore } from "@/lib/firebase-client";
import {
  getOperationalSummary,
  getRecentPendingApplications,
  type OperationalSummary,
} from "@/lib/dashboard-admin";
import {
  Badge,
  Card,
  CardContent,
  ErrorState,
  Heading,
  Icon,
  LoadingState,
  Text,
  useTranslation,
  DRIVER_APPLICATION_STATUS_LABEL_KEY,
  DRIVER_APPLICATION_STATUS_TONE,
  type IconName,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import type { DriverApplication } from "@the-ride/types";
import Link from "next/link";
import { useEffect, useState } from "react";

const TOP_TIER: { key: keyof OperationalSummary; href: string; icon: IconName }[] = [
  { key: "activeRides", href: "/trips", icon: "navigation" },
  { key: "driversOnline", href: "/drivers", icon: "car" },
  { key: "pendingApplications", href: "/drivers", icon: "fileText" },
  { key: "criticalAlerts", href: "/reports", icon: "alertTriangle" },
];

const QUICK_LINKS: { key: string; href: string; icon: IconName }[] = [
  { key: "payments", href: "/payments", icon: "creditCard" },
  { key: "wallet", href: "/wallet", icon: "wallet" },
  { key: "analytics", href: "/analytics", icon: "lineChart" },
  { key: "support", href: "/support", icon: "lifeBuoy" },
];

/**
 * UX Simplification sprint, Part 8 — was 8 equally-weighted cards: four
 * generic entity counts (drivers/passengers/trips/tickets) and four bare
 * link cards with no data behind them at all. Rebuilt around what's
 * actually operationally urgent right now (active rides, drivers online,
 * pending applications, critical alerts) as a prominent top tier, a real
 * preview of the applications actually waiting on a decision below it,
 * and everything else — payments/wallet/analytics/support — demoted to a
 * single row of small quick-link chips instead of full cards. Detailed
 * breakdowns stay on their own dedicated pages (Analytics, Reports),
 * matching "move detailed reports to dedicated pages."
 */
export default function AdminHomePage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [summary, setSummary] = useState<OperationalSummary | null>(null);
  const [recentApplications, setRecentApplications] = useState<DriverApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getOperationalSummary(adminFirestore),
      getRecentPendingApplications(adminFirestore),
    ])
      .then(([operational, applications]) => {
        if (cancelled) return;
        setSummary(operational);
        setRecentApplications(applications);
      })
      .catch((err: unknown) => {
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
        <>
          <div className="tablet:grid-cols-2 laptop:grid-cols-4 grid gap-4">
            {TOP_TIER.map((card) => (
              <Link key={card.key} href={card.href}>
                <Card className="hover:border-brand h-full transition-colors">
                  <CardContent className="flex flex-col gap-2 p-6">
                    <div className="flex items-center gap-2">
                      <Icon name={card.icon} size={16} className="text-brand" />
                      <Text size="sm" tone="muted">
                        {t(`admin.dashboardCounts.${card.key}`)}
                      </Text>
                    </div>
                    {summary === null ? (
                      <LoadingState title={t("common.loading")} />
                    ) : (
                      <span className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
                        {summary[card.key]}
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <Text weight="medium">{t("admin.dashboardCounts.recentApplications")}</Text>
                <Link href="/drivers" className="text-brand text-sm hover:underline">
                  {t("admin.dashboardCounts.view")}
                </Link>
              </div>
              {recentApplications === null ? (
                <LoadingState title={t("common.loading")} />
              ) : recentApplications.length === 0 ? (
                <Text tone="muted" size="sm">
                  {t("admin.dashboardCounts.noRecentApplications")}
                </Text>
              ) : (
                <ul className="flex flex-col gap-2">
                  {recentApplications.map((application) => (
                    <li
                      key={application.id}
                      className="flex items-center justify-between border-b border-neutral-100 py-2 last:border-0 dark:border-neutral-800"
                    >
                      <Text size="sm">
                        {application.personalInfo
                          ? `${application.personalInfo.firstName} ${application.personalInfo.lastName}`
                          : application.userId}
                      </Text>
                      <Badge tone={DRIVER_APPLICATION_STATUS_TONE[application.status]}>
                        {t(DRIVER_APPLICATION_STATUS_LABEL_KEY[application.status])}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="hover:border-brand flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm transition-colors dark:border-neutral-800"
              >
                <Icon name={link.icon} size={14} />
                {t(`admin.sidebar.${link.key}`)}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
