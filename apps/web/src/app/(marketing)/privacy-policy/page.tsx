"use client";

import { useTranslation } from "@the-ride/ui";

import { SimplePageLayout } from "@/components/SimplePageLayout";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();
  return (
    <SimplePageLayout
      title={t("website.privacyPolicy.title")}
      body={t("website.privacyPolicy.body")}
      icon="shieldCheck"
      updatedLabel={t("website.legal.lastUpdated", { date: "January 1, 2026" })}
    >
      <h2>{t("website.privacyPolicy.s1Title")}</h2>
      <p>{t("website.privacyPolicy.s1Body")}</p>
      <h2>{t("website.privacyPolicy.s2Title")}</h2>
      <p>{t("website.privacyPolicy.s2Body")}</p>
      <h2>{t("website.privacyPolicy.s3Title")}</h2>
      <p>{t("website.privacyPolicy.s3Body")}</p>
      <h2>{t("website.privacyPolicy.s4Title")}</h2>
      <p>{t("website.privacyPolicy.s4Body")}</p>
      <h2>{t("website.privacyPolicy.s5Title")}</h2>
      <p>{t("website.privacyPolicy.s5Body")}</p>
    </SimplePageLayout>
  );
}
