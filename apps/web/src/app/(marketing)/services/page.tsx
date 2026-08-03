"use client";

import { Badge, Button, Icon, type IconName, useTranslation } from "@the-ride/ui";
import Link from "next/link";

import { Hero } from "@/components/marketing/Hero";
import { SectionHeading } from "@/components/marketing/SectionHeading";

interface ServiceItem {
  icon: IconName;
  title: string;
  body: string;
  comingSoon?: boolean;
}

export default function ServicesPage() {
  const { t } = useTranslation();

  const services: ServiceItem[] = [
    {
      icon: "users",
      title: t("website.services.passengerTitle"),
      body: t("website.services.passengerBody"),
    },
    {
      icon: "car",
      title: t("website.services.driverTitle"),
      body: t("website.services.driverBody"),
    },
    {
      icon: "dollarSign",
      title: t("website.services.businessTitle"),
      body: t("website.services.businessBody"),
    },
    {
      icon: "navigation",
      title: t("website.services.airportTitle"),
      body: t("website.services.airportBody"),
    },
    {
      icon: "calendar",
      title: t("website.services.scheduledTitle"),
      body: t("website.services.scheduledBody"),
    },
    {
      icon: "clock",
      title: t("website.services.hourlyTitle"),
      body: t("website.services.hourlyBody"),
    },
    {
      icon: "users",
      title: t("website.services.sharedTitle"),
      body: t("website.services.sharedBody"),
    },
    {
      icon: "shieldCheck",
      title: t("website.services.corporateTitle"),
      body: t("website.services.corporateBody"),
    },
    {
      icon: "fileText",
      title: t("website.services.deliveryTitle"),
      body: t("website.services.deliveryBody"),
      comingSoon: true,
    },
  ];

  return (
    <div>
      <Hero>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-brand-300 mb-4 inline-block text-sm font-semibold uppercase tracking-widest">
            {t("website.services.eyebrow")}
          </span>
          <h1 className="tablet:text-5xl text-4xl font-bold text-white">
            {t("website.services.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-300">
            {t("website.services.body")}
          </p>
        </div>
      </Hero>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="tablet:grid-cols-2 laptop:grid-cols-3 grid gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="shadow-elevation1 duration-normal hover:shadow-elevation3 relative flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-white p-6 transition-all hover:-translate-y-1 dark:border-neutral-800 dark:bg-neutral-900"
            >
              {service.comingSoon && (
                <Badge tone="warning" className="absolute right-4 top-4">
                  {t("website.services.comingSoon")}
                </Badge>
              )}
              <span className="bg-brand-50 text-brand dark:bg-brand-900 flex h-11 w-11 items-center justify-center rounded-xl">
                <Icon name={service.icon} size={20} />
              </span>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">
                {service.title}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{service.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-neutral-50 py-20 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <SectionHeading
            title={t("website.services.ctaTitle")}
            subtitle={t("website.services.ctaSubtitle")}
            className="mb-8"
          />
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">{t("auth.signUp")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">{t("nav.contact")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
