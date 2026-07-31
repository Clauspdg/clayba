"use client";

import { useTranslation } from "@the-ride/ui";

import { SimplePageLayout } from "@/components/SimplePageLayout";

export default function AboutPage() {
  const { t } = useTranslation();
  return <SimplePageLayout title={t("website.about.title")} body={t("website.about.body")} />;
}
