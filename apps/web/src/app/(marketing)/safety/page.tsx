"use client";

import { useTranslation } from "@the-ride/ui";

import { SimplePageLayout } from "@/components/SimplePageLayout";

export default function SafetyPage() {
  const { t } = useTranslation();
  return <SimplePageLayout title={t("website.safety.title")} body={t("website.safety.body")} />;
}
