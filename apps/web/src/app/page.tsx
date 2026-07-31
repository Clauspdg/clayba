"use client";

import { Button, Card, CardContent, Heading, Icon, Text, useTranslation } from "@the-ride/ui";
import Link from "next/link";

export default function HomePage() {
  const { t } = useTranslation();

  const features = [
    { icon: "shieldCheck" as const, title: t("website.landing.feature1Title"), body: t("website.landing.feature1Body") },
    { icon: "clock" as const, title: t("website.landing.feature2Title"), body: t("website.landing.feature2Body") },
    { icon: "dollarSign" as const, title: t("website.landing.feature3Title"), body: t("website.landing.feature3Body") },
  ];

  return (
    <div>
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
        <Heading level={1}>{t("website.landing.heroTitle")}</Heading>
        <Text size="lg" tone="muted" className="max-w-2xl">
          {t("website.landing.heroSubtitle")}
        </Text>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/services">{t("website.landing.ctaPassenger")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/become-a-driver">{t("website.landing.ctaDriver")}</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Heading level={2} className="mb-8 text-center">
          {t("website.landing.featuresTitle")}
        </Heading>
        <div className="grid gap-6 tablet:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="flex flex-col items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand dark:bg-brand-900">
                  <Icon name={feature.icon} size={20} />
                </span>
                <Heading level={4}>{feature.title}</Heading>
                <Text tone="muted">{feature.body}</Text>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
