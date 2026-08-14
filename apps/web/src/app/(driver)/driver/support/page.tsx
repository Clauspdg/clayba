"use client";

import { SupportTickets } from "@/components/SupportTickets";
import { useTranslation } from "@the-ride/ui";

export default function DriverSupportPage() {
  const { t } = useTranslation();
  return <SupportTickets title={t("driverSpace.nav.support")} />;
}
