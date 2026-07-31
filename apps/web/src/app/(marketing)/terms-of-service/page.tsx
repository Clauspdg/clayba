"use client";

import { useTranslation } from "@the-ride/ui";

import { SimplePageLayout } from "@/components/SimplePageLayout";

export default function TermsOfServicePage() {
  const { t } = useTranslation();
  return <SimplePageLayout title={t("website.termsOfService.title")} body={t("website.termsOfService.body")} />;
}
