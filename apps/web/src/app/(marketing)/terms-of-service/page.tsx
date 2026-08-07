"use client";

import { useTranslation } from "@the-ride/ui";

import { SimplePageLayout } from "@/components/SimplePageLayout";

export default function TermsOfServicePage() {
  const { t } = useTranslation();
  return (
    <SimplePageLayout
      title={t("website.termsOfService.title")}
      body={t("website.termsOfService.body")}
      icon="fileText"
      updatedLabel={t("website.legal.lastUpdated", { date: "January 1, 2026" })}
    >
      <h2>{t("website.termsOfService.s1Title")}</h2>
      <p>{t("website.termsOfService.s1Body")}</p>
      <h2>{t("website.termsOfService.s2Title")}</h2>
      <p>{t("website.termsOfService.s2Body")}</p>
      <h2>{t("website.termsOfService.s3Title")}</h2>
      <p>{t("website.termsOfService.s3Body")}</p>
      <h2>{t("website.termsOfService.s4Title")}</h2>
      <p>{t("website.termsOfService.s4Body")}</p>
      <h2>{t("website.termsOfService.s5Title")}</h2>
      <p>{t("website.termsOfService.s5Body")}</p>
    </SimplePageLayout>
  );
}
