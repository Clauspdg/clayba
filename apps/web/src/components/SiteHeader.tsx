"use client";

import {
  Button,
  cn,
  LanguageSelector,
  Logo,
  ThemeSwitcher,
  TopNavigation,
  useTranslation,
} from "@the-ride/ui";
import { ExperienceState } from "@the-ride/types";
import {
  getDriverCtaLabelKey,
  isDriverApplicantState,
  isDriverState,
  isStaffState,
} from "@the-ride/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useScrolled } from "@/hooks/useScrolled";
import { useUserExperience } from "@/hooks/useUserExperience";
import { useNavigationContent } from "@/hooks/useSiteContent";
import { isAppShellRoute } from "@/lib/app-shell-routes";

/**
 * Only the landing page gets the floating transparent-over-hero navbar
 * this sprint asks for ("Transformer la Landing Page actuelle") — making
 * the header `fixed` globally would require compensating top-padding on
 * every other page's content, which is exactly the kind of broad,
 * unnecessary change the brief says not to risk ("Ne casser AUCUNE
 * fonctionnalité existante"). Every other page keeps the pre-Sprint-7
 * static, solid navbar completely unchanged.
 */
const HOME_PATH = "/";

export function SiteHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const scrolled = useScrolled();
  const navigation = useNavigationContent();
  const experience = useUserExperience();
  const state = experience.experience;

  if (isAppShellRoute(pathname)) {
    return null;
  }

  const isHome = pathname === HOME_PATH;
  const isTransparent = isHome && !scrolled;

  const isDriverApplicant = isDriverApplicantState(state);
  const isDriver = isDriverState(state);
  const isStaff = isStaffState(state);
  const isPassenger = state === ExperienceState.PASSENGER;
  const isGuest = state === ExperienceState.GUEST || state === null;

  /**
   * Nav links come straight from the UX-1 resolver's `navigationProfile`
   * (Part 2) — this component no longer decides which links a Passenger vs
   * Driver Applicant vs Driver sees, it only renders what
   * `resolveUserExperience()` already computed. The one exception is
   * GUEST, where a published Site Content CMS nav (`navigation.items`)
   * takes priority over the resolver's hardcoded marketing-nav fallback —
   * that override is presentation content, not experience logic.
   */
  const items = (
    isGuest
      ? (navigation.items ??
        experience.navigationProfile.map((item) => ({ label: t(item.labelKey), href: item.href })))
      : experience.navigationProfile.map((item) => ({ label: t(item.labelKey), href: item.href }))
  ).map((item) => ({ ...item, active: pathname === item.href }));

  const outlineButtonClass = isTransparent
    ? "border-white/40 text-white hover:bg-white/10 hover:text-white"
    : "";

  /**
   * HOME-02 — the single strongest action in the bar: layers an inset
   * top highlight (subtle depth) and a restrained orange-tinted glow
   * (stronger only on hover) on top of the shared `Button` primary
   * variant's flat `shadow-elevation1`/`hover:shadow-elevation2` — pill
   * shape and `bg-brand` come from `buttonVariants` already, untouched.
   */
  const primaryCtaClassName =
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_8px_20px_-8px_rgba(232,106,47,0.55)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_10px_28px_-8px_rgba(232,106,47,0.7)] transition-shadow duration-normal";

  /**
   * Primary CTA (Part 14's CTA audit table) — GUEST and PASSENGER both get
   * the "start application" prompt (a Passenger previously got no primary
   * CTA here at all, a gap this sprint fixes); a driver-applicant/driver
   * gets their stage-specific label instead; staff and everyone else gets
   * none.
   */
  const primaryCta =
    isDriverApplicant || isDriver ? (
      <Button size="sm" asChild className={primaryCtaClassName}>
        {/* UX-3 sprint (Dedicated Driver Space) — a real driver (active/
            suspended/inactive) goes straight to `/driver`, not through
            `/become-a-driver`'s own redirect; an applicant still goes there. */}
        <Link href={isDriver ? "/driver" : "/become-a-driver"}>
          {t(getDriverCtaLabelKey(state as ExperienceState))}
        </Link>
      </Button>
    ) : isGuest || experience.capabilities?.canStartDriverApplication ? (
      <Button size="sm" asChild className={primaryCtaClassName}>
        <Link href="/become-a-driver">{t("website.becomeDriverPage.cta")}</Link>
      </Button>
    ) : null;

  const secondaryCta =
    state === null || isStaff ? null : isPassenger || isDriverApplicant || isDriver ? (
      <Button size="sm" variant="outline" className={outlineButtonClass} asChild>
        <Link href="/profile">{t("nav.account")}</Link>
      </Button>
    ) : (
      <Button size="sm" variant="outline" className={outlineButtonClass} asChild>
        <Link href="/login">{t("auth.logIn")}</Link>
      </Button>
    );

  return (
    <TopNavigation
      linkComponent={Link}
      variant={isTransparent ? "transparent" : "solid"}
      className={cn(
        isHome && "fixed inset-x-0 top-0 z-50",
        // HOME-02 — replaces the shared component's own transparent/solid
        // surface classes (this `className` merges last via `cn`/
        // `tailwind-merge`, so conflicting utilities here win) with a
        // slower, eased transition and two refined surfaces: a light
        // glass wash over the Hero (subtle edge, no heavy blur) and a
        // translucent dark/light glass bar once scrolled (stronger blur
        // carries legibility instead of a near-opaque fill).
        "transition-[background-color,border-color,backdrop-filter,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isTransparent
          ? "border-b border-white/10 bg-gradient-to-b from-black/30 via-black/10 to-transparent backdrop-blur-sm"
          : "border-b border-neutral-900/[0.06] bg-white/75 shadow-[0_1px_0_0_rgba(0,0,0,0.03),0_12px_32px_-18px_rgba(0,0,0,0.14)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-950/70 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04),0_12px_32px_-18px_rgba(0,0,0,0.65)]",
      )}
      mobileMenuClassName="border-neutral-900/[0.06] bg-white/95 backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-950/95"
      logo={
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Link
            href="/"
            className={isTransparent ? "text-white" : "text-neutral-900 dark:text-neutral-50"}
          >
            {navigation.logoImageUrl ? (
              <span className="flex items-center gap-2">
                <img src={navigation.logoImageUrl} alt="" className="h-8 w-auto object-contain" />
                {navigation.logoText && (
                  <span className="text-lg font-semibold">{navigation.logoText}</span>
                )}
              </span>
            ) : (
              <Logo withWordmark />
            )}
          </Link>
        </motion.div>
      }
      items={items}
      menuLabel={t("nav.menu")}
      closeLabel={t("common.close")}
      actions={
        <div className="laptop:flex hidden items-center gap-3">
          <ThemeSwitcher
            lightLabel={t("common.light")}
            darkLabel={t("common.dark")}
            systemLabel={t("common.system")}
          />
          <LanguageSelector label={t("common.selectLanguage")} />
          {secondaryCta}
          {primaryCta}
        </div>
      }
      mobileExtra={
        <>
          <div className="flex items-center gap-3">
            <ThemeSwitcher
              lightLabel={t("common.light")}
              darkLabel={t("common.dark")}
              systemLabel={t("common.system")}
            />
            <LanguageSelector label={t("common.selectLanguage")} />
          </div>
          {secondaryCta}
          {primaryCta}
        </>
      }
    />
  );
}
