"use client";

import { Badge, Button, Heading, Icon, Text, useTranslation } from "@the-ride/ui";
import { motion } from "framer-motion";
import Link from "next/link";

import { BookingCard } from "@/components/marketing/BookingCard";
import { Hero } from "@/components/marketing/Hero";
import { MapPreview } from "@/components/marketing/MapPreview";
import { MobileAppSection } from "@/components/marketing/MobileAppSection";
import { ProcessSteps } from "@/components/marketing/ProcessSteps";
import { Reveal } from "@/components/marketing/Reveal";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { StatsSection } from "@/components/marketing/StatsSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { VehicleTypeGrid } from "@/components/marketing/VehicleTypeGrid";

export default function HomePage() {
  const { t } = useTranslation();

  const stats = [
    { value: "250K+", label: t("website.landing.stat1") },
    { value: "40+", label: t("website.landing.stat2") },
    { value: "4.9/5", label: t("website.landing.stat3") },
    { value: "12M+", label: t("website.landing.stat4") },
  ];

  const testimonials = [
    {
      name: "Amara Johnson",
      role: t("website.landing.testimonialRolePassenger"),
      city: "Chicago",
      trips: 128,
      quote: t("website.landing.testimonial1"),
      rating: 5,
    },
    {
      name: "Marcus Reed",
      role: t("website.landing.testimonialRoleDriver"),
      city: "Austin",
      trips: 940,
      quote: t("website.landing.testimonial2"),
      rating: 5,
    },
    {
      name: "Priya Nair",
      role: t("website.landing.testimonialRolePassenger"),
      city: "Miami",
      trips: 76,
      quote: t("website.landing.testimonial3"),
      rating: 4,
    },
  ];

  const steps = [
    {
      icon: "mapPin" as const,
      title: t("website.landing.step1Title"),
      description: t("website.landing.step1Body"),
    },
    {
      icon: "car" as const,
      title: t("website.landing.step2Title"),
      description: t("website.landing.step2Body"),
    },
    {
      icon: "checkCircle" as const,
      title: t("website.landing.step3Title"),
      description: t("website.landing.step3Body"),
    },
  ];

  const safetyFeatures = [
    {
      icon: "shieldCheck" as const,
      title: t("website.landing.safety1Title"),
      description: t("website.landing.safety1Body"),
    },
    {
      icon: "mapPin" as const,
      title: t("website.landing.safety2Title"),
      description: t("website.landing.safety2Body"),
    },
    {
      icon: "alertCircle" as const,
      title: t("website.landing.safety3Title"),
      description: t("website.landing.safety3Body"),
    },
  ];

  return (
    <div>
      {/* Hero + booking widget */}
      <Hero parallax className="tablet:pb-28 tablet:pt-44 -mt-16 px-6 pb-20 pt-36">
        <div className="laptop:grid-cols-[1.1fr_0.9fr] laptop:items-center mx-auto grid max-w-6xl gap-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start gap-6 text-left"
          >
            <Badge tone="brand" className="bg-brand/15 text-brand-200">
              {t("website.landing.heroEyebrow")}
            </Badge>
            <Heading level={1} className="text-white">
              {t("website.landing.heroTitle")}
            </Heading>
            <Text size="lg" className="max-w-xl text-neutral-300">
              {t("website.landing.heroSubtitle")}
            </Text>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/services">{t("website.landing.ctaPassenger")}</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/become-a-driver">{t("website.landing.ctaDriver")}</Link>
              </Button>
            </div>
          </motion.div>
          <div className="laptop:justify-end flex justify-center">
            <BookingCard />
          </div>
        </div>
      </Hero>

      {/* Stats */}
      <section className="mx-auto -mt-10 max-w-6xl px-6">
        <Reveal variant="scale">
          <StatsSection stats={stats} />
        </Reveal>
      </section>

      {/* Vehicle types */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <SectionHeading
            eyebrow={t("website.landing.vehiclesEyebrow")}
            title={t("website.landing.vehiclesTitle")}
            subtitle={t("website.landing.vehiclesSubtitle")}
            className="mb-12"
          />
        </Reveal>
        <VehicleTypeGrid />
      </section>

      {/* Map preview */}
      <section className="bg-neutral-50 py-24 dark:bg-neutral-900/40">
        <div className="laptop:grid-cols-2 mx-auto grid max-w-6xl items-center gap-12 px-6">
          <MapPreview />
          <Reveal className="flex flex-col gap-4">
            <SectionHeading
              align="left"
              eyebrow={t("website.landing.mapEyebrow")}
              title={t("website.landing.mapTitle")}
              subtitle={t("website.landing.mapSubtitle")}
            />
            <ul className="flex flex-col gap-3">
              {[
                t("website.landing.mapPoint1"),
                t("website.landing.mapPoint2"),
                t("website.landing.mapPoint3"),
              ].map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <Icon name="checkCircle" size={18} className="text-brand mt-0.5 shrink-0" />
                  <span className="text-neutral-600 dark:text-neutral-300">{point}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <SectionHeading
            eyebrow={t("website.landing.howItWorksEyebrow")}
            title={t("website.landing.howItWorksTitle")}
            className="mb-14"
          />
        </Reveal>
        <ProcessSteps steps={steps} />
      </section>

      {/* Safety */}
      <section className="relative overflow-hidden bg-neutral-900 py-24">
        <div className="bg-brand/20 pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" />
        <div className="bg-brand/10 pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionHeading
              eyebrow={t("website.landing.safetyEyebrow")}
              title={t("website.landing.safetyTitle")}
              subtitle={t("website.landing.safetySubtitle")}
              className="mb-12 [&_h2]:text-white [&_p]:text-neutral-300"
            />
          </Reveal>
          <div className="tablet:grid-cols-3 grid gap-6">
            {safetyFeatures.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="duration-normal group relative h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-shadow hover:shadow-[0_0_40px_-8px_rgba(232,106,47,0.45)]"
                >
                  <span className="bg-brand/20 text-brand-300 group-hover:bg-brand/30 mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-colors">
                    <Icon name={feature.icon} size={20} />
                  </span>
                  <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
                  <p className="mb-3 text-sm text-neutral-400">{feature.description}</p>
                  <Badge tone="brand" className="bg-brand/15 text-brand-200">
                    <Icon name="shieldCheck" size={12} />
                    {t("website.landing.safetyBadge")}
                  </Badge>
                </motion.div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/safety">{t("website.landing.safetyCta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <SectionHeading
            eyebrow={t("website.landing.testimonialsEyebrow")}
            title={t("website.landing.testimonialsTitle")}
            className="mb-12"
          />
        </Reveal>
        <TestimonialsSection testimonials={testimonials} />
      </section>

      {/* Mobile app */}
      <MobileAppSection />

      {/* Driver CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal variant="scale">
          <div className="to-brand-900 shadow-elevation4 flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-neutral-900 px-8 py-16 text-center">
            <Heading level={2} className="text-white">
              {t("website.landing.driverCtaTitle")}
            </Heading>
            <Text size="lg" className="max-w-xl text-neutral-300">
              {t("website.landing.driverCtaBody")}
            </Text>
            <Button size="lg" asChild>
              <Link href="/become-a-driver">{t("website.landing.driverCtaButton")}</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
