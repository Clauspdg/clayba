"use client";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  Text,
  useTranslation,
} from "@the-ride/ui";
import {
  getDriverDashboardCardBodyLabelKey,
  getDriverDashboardCardCtaLabelKey,
} from "@the-ride/utils";
import Link from "next/link";

import { useUserExperience } from "@/hooks/useUserExperience";

/**
 * Passenger → Driver entry point sprint, Part 1 — a dedicated card on the
 * Passenger Dashboard pointing at the driver journey, whatever stage it's
 * actually at. Always routes to `/become-a-driver` — the one
 * lifecycle-aware page that already renders the correct screen per state
 * (recruitment, resume, status portal, approval, active dashboard,
 * suspended) — never a second entry point that could start a duplicate
 * application. Renders nothing until the resolver has an answer, so it
 * never flashes the wrong CTA for a driver applicant/active driver.
 */
export function DriverEntryCard() {
  const { t } = useTranslation();
  const { experience } = useUserExperience();

  if (!experience) return null;

  return (
    <Card className="duration-normal hover:shadow-elevation3 transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="car" size={18} className="text-brand" />
          {t("becomeDriver.entryPoint.cardTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Text tone="muted" size="sm">
          {t(getDriverDashboardCardBodyLabelKey(experience))}
        </Text>
        <Button size="sm" asChild className="self-start">
          <Link href="/become-a-driver">{t(getDriverDashboardCardCtaLabelKey(experience))}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
