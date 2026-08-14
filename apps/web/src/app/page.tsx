"use client";

import { Badge, Button, Heading, Icon, Text, useTranslation, type IconName } from "@the-ride/ui";
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
import {
  useDriverCtaContent,
  useHomepageContent,
  useHowItWorksContent,
  useSafetyContent,
  useSectionsContent,
  useStatisticsContent,
  useTestimonials,
  useTrackingContent,
  type ResolvedProcessStep,
  type ResolvedSafetyCard,
  type ResolvedStatistic,
  type ResolvedTestimonial,
} from "@/hooks/useSiteContent";
import { useUserExperience } from "@/hooks/useUserExperience";
import { ExperienceState, type SectionKey } from "@the-ride/types";
import { hasDriverJourney, isDriverState } from "@the-ride/utils";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const homepage = useHomepageContent();
  const {
    experience: state,
    loading: experienceLoading,
    preferredLandingRoute,
  } = useUserExperience();
  const isAuthenticated = state !== null && state !== ExperienceState.GUEST;
  const hasApplicationOrDriverRecord = hasDriverJourney(state);
  const sectionOrder = useSectionsContent();

  /**
   * UX-2 sprint, Parts 3-4 — "/" stays the strong marketing homepage for
   * GUEST (Part 3), but a signed-in Passenger (or driver-applicant/driver)
   * must not see that same guest-acquisition page (Part 4). Rather than
   * building a second, duplicate "passenger home" here, this redirects to
   * `preferredLandingRoute` (UX-1's resolver) — `/dashboard` for a
   * Passenger, already a complete booking-focused home with a real
   * current-ride/no-active-ride state, wallet, notifications, and saved
   * places (Part 13's "do not invent fake functionality just to eliminate a
   * Coming Soon page" cuts the other way here too: don't duplicate a real
   * page that already exists). Staff's `preferredLandingRoute` is `/`
   * itself (no redirect target, no loop). Reuses the single
   * `useUserExperience()` call above instead of a second one, so this page
   * only ever triggers one Firestore fetch (shared via
   * `UserExperienceProvider`), not two.
   */
  // UX-3 sprint (Dedicated Driver Space) — debounced for the same reason as
  // `RequireDriverAccess`/`login/page.tsx`: `onIdTokenChanged` can fire
  // more than once on a fresh sign-in, and `experienceLoading` going false
  // once isn't reliable proof `preferredLandingRoute` is the final answer.
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current);
      redirectTimer.current = null;
    }
    if (experienceLoading || !preferredLandingRoute || preferredLandingRoute === "/") return;
    redirectTimer.current = setTimeout(() => {
      router.replace(preferredLandingRoute);
    }, 1200);
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [experienceLoading, preferredLandingRoute, router]);

  const DEFAULT_STATS: ResolvedStatistic[] = [
    { value: "250K+", label: t("website.landing.stat1") },
    { value: "40+", label: t("website.landing.stat2") },
    { value: "4.9/5", label: t("website.landing.stat3") },
    { value: "12M+", label: t("website.landing.stat4") },
  ];
  const stats = useStatisticsContent(DEFAULT_STATS);

  const DEFAULT_TESTIMONIALS: ResolvedTestimonial[] = [
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
  const testimonials = useTestimonials(DEFAULT_TESTIMONIALS);

  const DEFAULT_STEPS: ResolvedProcessStep[] = [
    {
      icon: "mapPin",
      title: t("website.landing.step1Title"),
      description: t("website.landing.step1Body"),
    },
    {
      icon: "car",
      title: t("website.landing.step2Title"),
      description: t("website.landing.step2Body"),
    },
    {
      icon: "checkCircle",
      title: t("website.landing.step3Title"),
      description: t("website.landing.step3Body"),
    },
  ];
  const howItWorks = useHowItWorksContent(DEFAULT_STEPS);

  const DEFAULT_SAFETY_CARDS: ResolvedSafetyCard[] = [
    {
      icon: "shieldCheck",
      title: t("website.landing.safety1Title"),
      description: t("website.landing.safety1Body"),
      badgeText: t("website.landing.safetyBadge"),
    },
    {
      icon: "mapPin",
      title: t("website.landing.safety2Title"),
      description: t("website.landing.safety2Body"),
      badgeText: t("website.landing.safetyBadge"),
    },
    {
      icon: "alertCircle",
      title: t("website.landing.safety3Title"),
      description: t("website.landing.safety3Body"),
      badgeText: t("website.landing.safetyBadge"),
    },
  ];
  const safety = useSafetyContent(DEFAULT_SAFETY_CARDS);
  const driverCta = useDriverCtaContent();

  const tracking = useTrackingContent({
    eyebrow: t("website.landing.mapEyebrow"),
    title: t("website.landing.mapTitle"),
    subtitle: t("website.landing.mapSubtitle"),
    distanceValue: "12.4 km",
    etaValue: "18 min",
    points: [
      t("website.landing.mapPoint1"),
      t("website.landing.mapPoint2"),
      t("website.landing.mapPoint3"),
    ],
  });
  const [driverVideoFailed, setDriverVideoFailed] = useState(false);
  const showDriverVideo = Boolean(driverCta.backgroundVideoUrl) && !driverVideoFailed;
  const showDriverImage = !showDriverVideo && Boolean(driverCta.backgroundImageUrl);

  const sectionRenderers: Record<SectionKey, ReactNode> = {
    stats: (
      <section className="mx-auto max-w-6xl px-6 pt-16">
        <Reveal variant="scale">
          <StatsSection stats={stats} />
        </Reveal>
      </section>
    ),
    vehicleTypes: (
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
    ),
    mapPreview: (
      <section className="bg-neutral-50 py-24 dark:bg-neutral-900/40">
        <div className="laptop:grid-cols-2 mx-auto grid max-w-6xl items-center gap-12 px-6">
          <MapPreview distanceValue={tracking.distanceValue} etaValue={tracking.etaValue} />
          <Reveal className="flex flex-col gap-4">
            <SectionHeading
              align="left"
              eyebrow={tracking.eyebrow}
              title={tracking.title}
              subtitle={tracking.subtitle}
            />
            <ul className="flex flex-col gap-3">
              {tracking.points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <Icon name="checkCircle" size={18} className="text-brand mt-0.5 shrink-0" />
                  <span className="text-neutral-600 dark:text-neutral-300">{point}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    ),
    howItWorks: (
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <SectionHeading eyebrow={howItWorks.eyebrow} title={howItWorks.title} className="mb-14" />
        </Reveal>
        <ProcessSteps
          steps={howItWorks.steps.map((step) => ({ ...step, icon: step.icon as IconName }))}
        />
      </section>
    ),
    safety: (
      <section className="relative overflow-hidden bg-neutral-900 py-24">
        <div className="bg-brand/20 pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" />
        <div className="bg-brand/10 pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionHeading
              eyebrow={safety.eyebrow}
              title={safety.title}
              subtitle={safety.subtitle}
              className="mb-12 [&_h2]:text-white [&_p]:text-neutral-300"
            />
          </Reveal>
          <div className="tablet:grid-cols-3 grid gap-6">
            {safety.cards.map((card, index) => (
              <Reveal key={card.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="duration-normal group relative h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-shadow hover:shadow-[0_0_40px_-8px_rgba(232,106,47,0.45)]"
                >
                  <span className="bg-brand/20 text-brand-300 group-hover:bg-brand/30 mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-colors">
                    <Icon name={card.icon as IconName} size={20} />
                  </span>
                  <h3 className="mb-2 font-semibold text-white">{card.title}</h3>
                  <p className="mb-3 text-sm text-neutral-400">{card.description}</p>
                  <Badge tone="brand" className="bg-brand/15 text-brand-200">
                    <Icon name="shieldCheck" size={12} />
                    {card.badgeText}
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
              <Link href={safety.ctaHref}>{safety.ctaLabel}</Link>
            </Button>
          </div>
        </div>
      </section>
    ),
    testimonials: (
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
    ),
    mobileApp: <MobileAppSection />,
    driverCta: (
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal variant="scale">
          <div className="to-brand-900 shadow-elevation4 relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 px-8 py-16 text-center">
            {showDriverVideo && (
              <video
                src={driverCta.backgroundVideoUrl}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                onError={() => setDriverVideoFailed(true)}
                onStalled={() => setDriverVideoFailed(true)}
              />
            )}
            {showDriverImage && (
              <img
                src={driverCta.backgroundImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {(showDriverVideo || showDriverImage) && (
              <div className="absolute inset-0 bg-neutral-900/60" />
            )}
            <Heading level={2} className="relative text-white">
              {driverCta.title}
            </Heading>
            <Text size="lg" className="relative max-w-xl text-neutral-300">
              {driverCta.subtitle}
            </Text>
            <Button size="lg" className="relative" asChild>
              <Link href={driverCta.buttonHref}>{driverCta.buttonLabel}</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    ),
  };

  return (
    <div>
      {/* Hero + booking widget */}
      {homepage.visible && (
        <Hero
          parallax
          className="tablet:pb-8 tablet:pt-20 px-6 pb-8 pt-24"
          backgroundDesktopImageUrl={homepage.backgroundDesktopImageUrl}
          backgroundLaptopImageUrl={homepage.backgroundLaptopImageUrl}
          backgroundTabletImageUrl={homepage.backgroundTabletImageUrl}
          backgroundMobileImageUrl={homepage.backgroundMobileImageUrl}
          backgroundDesktopVideoUrl={homepage.backgroundDesktopVideoUrl}
          backgroundMobileVideoUrl={homepage.backgroundMobileVideoUrl}
          backgroundPosterImageUrl={homepage.backgroundPosterImageUrl}
        >
          <div className="laptop:grid-cols-[1.1fr_0.9fr] laptop:items-center mx-auto grid max-w-6xl gap-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`flex flex-col gap-4 ${homepage.textAlign === "center" ? "items-center text-center" : "items-start text-left"}`}
            >
              <Badge
                tone="brand"
                className="bg-brand/15 text-brand-200"
                style={
                  homepage.accentColor
                    ? { backgroundColor: `${homepage.accentColor}26`, color: homepage.accentColor }
                    : undefined
                }
              >
                {homepage.eyebrow}
              </Badge>
              <Heading level={1} className="text-white">
                {homepage.title}
              </Heading>
              <Text size="lg" className="max-w-xl text-neutral-300">
                {homepage.subtitle}
              </Text>
              {homepage.introText && (
                <Text size="base" className="max-w-xl text-neutral-400">
                  {homepage.introText}
                </Text>
              )}
              <div
                className={`flex flex-wrap gap-3 ${homepage.textAlign === "center" ? "justify-center" : ""}`}
              >
                {homepage.ctaPassengerEnabled && (
                  <Button
                    size="lg"
                    asChild
                    style={
                      homepage.accentColor ? { backgroundColor: homepage.accentColor } : undefined
                    }
                  >
                    {/* Authenticated users get a real, actionable "Book a Ride" CTA instead of the generic guest-facing "/services" link (Part 3). */}
                    <Link href={isAuthenticated ? "/book" : homepage.ctaPassengerHref}>
                      {isAuthenticated ? t("passengerNav.bookRide") : homepage.ctaPassengerLabel}
                    </Link>
                  </Button>
                )}
                {homepage.ctaDriverEnabled && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                    asChild
                  >
                    {/* Never show "Become a Driver" marketing copy once the user already has an application/driver record (Part 3) — point them at their real status instead. */}
                    <Link
                      href={
                        hasApplicationOrDriverRecord ? "/become-a-driver" : homepage.ctaDriverHref
                      }
                    >
                      {hasApplicationOrDriverRecord
                        ? t(isDriverState(state) ? "nav.driverStatus" : "nav.myApplication")
                        : homepage.ctaDriverLabel}
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
            <div className="laptop:justify-end flex justify-center">
              <BookingCard />
            </div>
          </div>
        </Hero>
      )}

      {sectionOrder.map((key) => (
        <div key={key}>{sectionRenderers[key]}</div>
      ))}
    </div>
  );
}
