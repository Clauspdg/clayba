"use client";

import { Button, useTranslation } from "@the-ride/ui";
import Link from "next/link";

const QUICK_LINKS = [
  { href: "/", key: "nav.home" },
  { href: "/services", key: "nav.services" },
  { href: "/become-a-driver", key: "nav.becomeDriver" },
  { href: "/contact", key: "nav.contact" },
] as const;

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <div
        className="bg-brand/10 absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        aria-hidden="true"
      />
      <span className="from-brand to-brand-700 tablet:text-9xl relative bg-gradient-to-br bg-clip-text text-8xl font-extrabold text-transparent">
        404
      </span>
      <h1 className="tablet:text-3xl relative mt-4 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        {t("website.notFound.title")}
      </h1>
      <p className="relative mt-3 max-w-md text-neutral-500 dark:text-neutral-400">
        {t("website.notFound.body")}
      </p>

      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">{t("website.notFound.cta")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">{t("nav.contact")}</Link>
        </Button>
      </div>

      <div className="relative mt-12 flex flex-wrap justify-center gap-4">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-brand text-sm font-medium text-neutral-500 transition-colors dark:text-neutral-400"
          >
            {t(link.key)}
          </Link>
        ))}
      </div>
    </div>
  );
}
