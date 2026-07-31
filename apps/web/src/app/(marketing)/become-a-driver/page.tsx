"use client";

import { Button, useTranslation } from "@the-ride/ui";

import { SimplePageLayout } from "@/components/SimplePageLayout";

export default function BecomeADriverPage() {
  const { t } = useTranslation();
  return (
    <SimplePageLayout title={t("website.becomeDriverPage.title")} body={t("website.becomeDriverPage.body")}>
      <Button size="lg" className="mt-6">
        {t("website.becomeDriverPage.cta")}
      </Button>
    </SimplePageLayout>
  );
}
