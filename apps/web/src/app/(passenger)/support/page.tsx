"use client";

import { SupportTickets } from "@/components/SupportTickets";
import { useTranslation } from "@the-ride/ui";

export default function SupportPage() {
  const { t } = useTranslation();
  return <SupportTickets title={t("passengerNav.support")} />;
}
