"use client";

import { useUserExperience } from "@/hooks/useUserExperience";
import { Card, CardContent, Heading, LoadingState, Text, useTranslation } from "@the-ride/ui";

/**
 * UX-3 sprint (Dedicated Driver Space), Part 13 — real metrics only, all
 * already tracked on the driver's own `drivers/{uid}` record (the same
 * fields `DispatchService`'s matching engine scores candidates on). No
 * rider-feedback text/warnings list exists anywhere client-readable yet —
 * `warningsCount` is the only real signal for that, shown as a number, not
 * fabricated feedback quotes.
 */
export default function DriverPerformancePage() {
  const { t } = useTranslation();
  const { driver } = useUserExperience();

  if (!driver) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  const hasEnoughData = driver.completedTrips > 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Heading level={1}>{t("driverSpace.nav.performance")}</Heading>

      {!hasEnoughData && (
        <Text tone="muted" size="sm">
          {t("driverSpace.performance.notEnoughData")}
        </Text>
      )}

      <div className="tablet:grid-cols-2 grid gap-4">
        <MetricCard label={t("driverSpace.home.ratingLabel")} value={driver.rating.toFixed(1)} />
        <MetricCard
          label={t("driverSpace.performance.completedTripsLabel")}
          value={String(driver.completedTrips)}
        />
        <MetricCard
          label={t("driverSpace.home.acceptanceRateLabel")}
          value={`${Math.round(driver.acceptanceRate * 100)}%`}
        />
        <MetricCard
          label={t("driverSpace.performance.cancellationRateLabel")}
          value={`${Math.round(driver.cancellationRate * 100)}%`}
        />
        <MetricCard label={t("driverSpace.performance.scoreLabel")} value={String(driver.score)} />
        <MetricCard
          label={t("driverSpace.performance.warningsLabel")}
          value={String(driver.warningsCount)}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-6">
        <Text size="sm" tone="muted">
          {label}
        </Text>
        <Text size="lg" weight="medium">
          {value}
        </Text>
      </CardContent>
    </Card>
  );
}
