"use client";

import { useTranslation } from "@the-ride/ui";

import { SimplePageLayout } from "@/components/SimplePageLayout";

export default function ServicesPage() {
  const { t } = useTranslation();
  return <SimplePageLayout title={t("website.services.title")} body={t("website.services.body")} />;
}
