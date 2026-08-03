"use client";

import { Badge, useTranslation } from "@the-ride/ui";

import { FeatureCard } from "@/components/marketing/FeatureCard";
import { Hero } from "@/components/marketing/Hero";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { StatsSection } from "@/components/marketing/StatsSection";

export default function SafetyPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: "shieldCheck" as const,
      title: t("website.safety.verifiedDriversTitle"),
      body: t("website.safety.verifiedDriversBody"),
    },
    {
      icon: "mapPin" as const,
      title: t("website.safety.gpsTitle"),
      body: t("website.safety.gpsBody"),
    },
    {
      icon: "alertCircle" as const,
      title: t("website.safety.sosTitle"),
      body: t("website.safety.sosBody"),
    },
    {
      icon: "users" as const,
      title: t("website.safety.tripSharingTitle"),
      body: t("website.safety.tripSharingBody"),
    },
    {
      icon: "phone" as const,
      title: t("website.safety.emergencyContactsTitle"),
      body: t("website.safety.emergencyContactsBody"),
    },
    {
      icon: "fileText" as const,
      title: t("website.safety.insuranceTitle"),
      body: t("website.safety.insuranceBody"),
    },
    {
      icon: "star" as const,
      title: t("website.safety.ratingsTitle"),
      body: t("website.safety.ratingsBody"),
    },
    {
      icon: "checkCircle" as const,
      title: t("website.safety.trustTitle"),
      body: t("website.safety.trustBody"),
    },
  ];

  const stats = [
    { value: "100%", label: t("website.safety.stat1") },
    { value: "24/7", label: t("website.safety.stat2") },
    { value: "<30s", label: t("website.safety.stat3") },
    { value: "4.9/5", label: t("website.safety.stat4") },
  ];

  return (
    <div>
      <Hero>
        <div className="mx-auto max-w-3xl text-center">
          <Badge tone="brand" className="bg-brand/15 text-brand-200 mb-4">
            {t("website.safety.eyebrow")}
          </Badge>
          <h1 className="tablet:text-5xl text-4xl font-bold text-white">
            {t("website.safety.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-300">
            {t("website.safety.body")}
          </p>
        </div>
      </Hero>

      <section className="mx-auto max-w-6xl px-6 pt-16">
        <StatsSection stats={stats} />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow={t("website.safety.featuresEyebrow")}
          title={t("website.safety.featuresTitle")}
          subtitle={t("website.safety.featuresSubtitle")}
          className="mb-12"
        />
        <div className="tablet:grid-cols-2 laptop:grid-cols-4 grid gap-6">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.body}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
