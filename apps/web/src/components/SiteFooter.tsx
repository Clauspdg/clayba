"use client";

import { Divider, useTranslation } from "@the-ride/ui";
import Link from "next/link";

export function SiteFooter() {
  const { t } = useTranslation();

  const companyLinks = [
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.safety"), href: "/safety" },
    { label: t("nav.services"), href: "/services" },
    { label: t("nav.becomeDriver"), href: "/become-a-driver" },
  ];

  const supportLinks = [
    { label: t("nav.faq"), href: "/faq" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  const legalLinks = [
    { label: t("nav.privacy"), href: "/privacy-policy" },
    { label: t("nav.terms"), href: "/terms-of-service" },
  ];

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 tablet:grid-cols-2 laptop:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{t("common.appName")}</p>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{t("footer.tagline")}</p>
        </div>
        <FooterColumn title={t("footer.company")} links={companyLinks} />
        <FooterColumn title={t("footer.support")} links={supportLinks} />
        <FooterColumn title={t("footer.legal")} links={legalLinks} />
      </div>
      <Divider />
      <p className="px-6 py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
        © {new Date().getFullYear()} {t("common.appName")} — {t("footer.rights")}
      </p>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
