"use client";

import { useTranslation } from "@the-ride/ui";

import { SimplePageLayout } from "@/components/SimplePageLayout";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();
  return <SimplePageLayout title={t("website.privacyPolicy.title")} body={t("website.privacyPolicy.body")} />;
}
