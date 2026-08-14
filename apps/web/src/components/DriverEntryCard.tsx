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
  isDriverState,
} from "@the-ride/utils";
import Link from "next/link";

import { useUserExperience } from "@/hooks/useUserExperience";

/**
 * Passenger → Driver entry point sprint, Part 1 (updated by UX-3 —
 * Dedicated Driver Space, Part 25) — a dedicated card on the Passenger
 * Dashboard pointing at the driver journey, whatever stage it's actually
 * at. Applicant stages still route to `/become-a-driver` (the one
 * lifecycle-aware page for that journey); a real driver (active,
 * suspended, or inactive) now routes to `/driver` instead — the dedicated
 * Driver Space, not the applicant page. Renders nothing until the resolver
 * has an answer, so it never flashes the wrong CTA for a driver
 * applicant/active driver.
 */
export function DriverEntryCard() {
  const { t } = useTranslation();
  const { experience } = useUserExperience();

  if (!experience) return null;

  const href = isDriverState(experience) ? "/driver" : "/become-a-driver";

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
          <Link href={href}>{t(getDriverDashboardCardCtaLabelKey(experience))}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
