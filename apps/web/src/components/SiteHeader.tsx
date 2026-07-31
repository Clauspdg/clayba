"use client";

import { Button, LanguageSelector, Logo, ThemeSwitcher, TopNavigation, useTranslation } from "@the-ride/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();

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
      logo={
        <Link href="/" className="text-neutral-900 dark:text-neutral-50">
          <Logo withWordmark />
        </Link>
      }
      items={items}
      actions={
        <>
          <ThemeSwitcher lightLabel={t("common.light")} darkLabel={t("common.dark")} systemLabel={t("common.system")} />
          <LanguageSelector label={t("common.selectLanguage")} />
          <Button size="sm" asChild>
            <Link href="/become-a-driver">{t("website.becomeDriverPage.cta")}</Link>
          </Button>
        </>
      }
    />
  );
}
