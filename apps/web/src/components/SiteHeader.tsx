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
import { isDriverApplicantState, isDriverState, isStaffState } from "@the-ride/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useScrolled } from "@/hooks/useScrolled";
import { useExperienceState } from "@/hooks/useExperienceState";
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
  const { state } = useExperienceState();

  if (isPassengerShellRoute(pathname)) {
    return null;
  }

  const isHome = pathname === HOME_PATH;
  const isTransparent = isHome && !scrolled;

  const isDriverApplicant = isDriverApplicantState(state);
  const isDriver = isDriverState(state);
  const isStaff = isStaffState(state);
  const isPassenger = state === ExperienceState.PASSENGER;

  /**
   * Nav links change by experience state (Part 12) — driver-applicant and
   * driver states all currently resolve to the single lifecycle-aware
   * `/become-a-driver` page (there is no separate Application/Status/
   * Documents/Trips/Earnings page in this app yet), so their nav
   * intentionally has fewer, non-duplicate entries rather than several
   * links pointing at the same place.
   */
  const items = (
    isPassenger
      ? [
          { label: t("passengerNav.bookRide"), href: "/book" },
          { label: t("passengerNav.rideHistory"), href: "/rides" },
          { label: t("passengerNav.savedPlaces"), href: "/saved-places" },
          { label: t("passengerNav.notifications"), href: "/notifications" },
          { label: t("passengerNav.support"), href: "/support" },
        ]
      : isDriverApplicant || isDriver
        ? [
            {
              label: isDriver ? t("nav.driverStatus") : t("nav.myApplication"),
              href: "/become-a-driver",
            },
            { label: t("passengerNav.support"), href: "/support" },
          ]
        : isStaff
          ? []
          : (navigation.items ?? [
              { label: t("nav.about"), href: "/about" },
              { label: t("nav.safety"), href: "/safety" },
              { label: t("nav.services"), href: "/services" },
              { label: t("nav.becomeDriver"), href: "/become-a-driver" },
              { label: t("nav.faq"), href: "/faq" },
              { label: t("nav.contact"), href: "/contact" },
            ])
  ).map((item) => ({ ...item, active: pathname === item.href }));

  const outlineButtonClass = isTransparent
    ? "border-white/40 text-white hover:bg-white/10 hover:text-white"
    : "";

  /** Primary CTA replaces "Become a Driver" once the user already has an application/driver record (Part 3: never show it as the primary CTA in that case). */
  const primaryCta = isDriver ? (
    <Button size="sm" asChild>
      <Link href="/become-a-driver">{t("nav.driverStatus")}</Link>
    </Button>
  ) : isDriverApplicant ? (
    <Button size="sm" asChild>
      <Link href="/become-a-driver">{t("nav.myApplication")}</Link>
    </Button>
  ) : !isPassenger && !isStaff ? (
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
