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
import { isPassengerShellRoute } from "@/lib/passenger-shell-routes";

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

  if (isPassengerShellRoute(pathname)) {
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
   * Primary CTA (Part 14's CTA audit table) — GUEST and PASSENGER both get
   * the "start application" prompt (a Passenger previously got no primary
   * CTA here at all, a gap this sprint fixes); a driver-applicant/driver
   * gets their stage-specific label instead; staff and everyone else gets
   * none.
   */
  const primaryCta =
    isDriverApplicant || isDriver ? (
      <Button size="sm" asChild>
        {/* UX-3 sprint (Dedicated Driver Space) — a real driver (active/
            suspended/inactive) goes straight to `/driver`, not through
            `/become-a-driver`'s own redirect; an applicant still goes there. */}
        <Link href={isDriver ? "/driver" : "/become-a-driver"}>
          {t(getDriverCtaLabelKey(state as ExperienceState))}
        </Link>
      </Button>
    ) : isGuest || experience.capabilities?.canStartDriverApplication ? (
      <Button size="sm" asChild>
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
      className={cn(isHome && "fixed inset-x-0 top-0 z-50", !isTransparent && "shadow-elevation1")}
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
