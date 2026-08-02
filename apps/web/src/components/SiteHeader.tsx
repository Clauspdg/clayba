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
import { useAuth } from "@the-ride/hooks";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useScrolled } from "@/hooks/useScrolled";

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
  const { status } = useAuth();
  const scrolled = useScrolled();

  const isHome = pathname === HOME_PATH;
  const isTransparent = isHome && !scrolled;

  const items = [
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.safety"), href: "/safety" },
    { label: t("nav.services"), href: "/services" },
    { label: t("nav.becomeDriver"), href: "/become-a-driver" },
    { label: t("nav.faq"), href: "/faq" },
    { label: t("nav.contact"), href: "/contact" },
  ].map((item) => ({ ...item, active: pathname === item.href }));

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
            <Logo withWordmark />
          </Link>
        </motion.div>
      }
      items={items}
      menuLabel={t("common.menu")}
      closeLabel={t("common.close")}
      actions={
        <>
          <ThemeSwitcher
            lightLabel={t("common.light")}
            darkLabel={t("common.dark")}
            systemLabel={t("common.system")}
          />
          <LanguageSelector label={t("common.selectLanguage")} />
          {status === "authenticated" ? (
            <Button
              size="sm"
              variant="outline"
              className={
                isTransparent ? "border-white/40 text-white hover:bg-white/10 hover:text-white" : ""
              }
              asChild
            >
              <Link href="/dashboard">{t("passengerNav.dashboard")}</Link>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className={
                isTransparent ? "border-white/40 text-white hover:bg-white/10 hover:text-white" : ""
              }
              asChild
            >
              <Link href="/login">{t("auth.logIn")}</Link>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href="/become-a-driver">{t("website.becomeDriverPage.cta")}</Link>
          </Button>
        </>
      }
    />
  );
}
