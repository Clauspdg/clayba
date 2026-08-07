"use client";

import { useTranslation } from "@the-ride/ui";

import { SimplePageLayout } from "@/components/SimplePageLayout";

export default function CookiesPage() {
  const { t } = useTranslation();
  return (
    <SimplePageLayout
      title={t("website.cookies.title")}
      body={t("website.cookies.body")}
      icon="fileText"
      updatedLabel={t("website.legal.lastUpdated", { date: "January 1, 2026" })}
    >
      <h2>{t("website.cookies.s1Title")}</h2>
      <p>{t("website.cookies.s1Body")}</p>
      <h2>{t("website.cookies.s2Title")}</h2>
      <p>{t("website.cookies.s2Body")}</p>
      <ul>
        <li>{t("website.cookies.type1")}</li>
        <li>{t("website.cookies.type2")}</li>
        <li>{t("website.cookies.type3")}</li>
      </ul>
      <h2>{t("website.cookies.s3Title")}</h2>
      <p>{t("website.cookies.s3Body")}</p>
    </SimplePageLayout>
  );
}
