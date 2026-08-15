"use client";

import { useFooterContent } from "@/hooks/useSiteContent";
import { isAppShellRoute } from "@/lib/app-shell-routes";
import { Button, Divider, Icon, Input, Logo, useTranslation, type IconName } from "@the-ride/ui";
import { RELEASE_VERSION_STRING } from "@the-ride/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";

const DEFAULT_SOCIAL_LINKS: { icon: IconName; label: string; href: string }[] = [
  { icon: "globe", label: "Website", href: "https://the-ride.app" },
  { icon: "mail", label: "Email", href: "mailto:support@theride.app" },
  { icon: "phone", label: "Phone", href: "tel:+18005550123" },
];

/**
 * UX-2 sprint, Part 1 (hydration-warning root cause): the copyright year
 * used to call `new Date().getFullYear()` directly in the render body —
 * the same class of bug as the dev-build banner below (see
 * `next.config.ts`'s comment): a value computed fresh on every render
 * differs between the server-rendered HTML and the client's hydration
 * pass whenever those two renders straddle a real-world boundary (there,
 * milliseconds; here, only a year rollover, so it was far rarer, but not
 * actually safe). `NEXT_PUBLIC_BUILD_DATE` is now a single, stable
 * build-time constant (never recomputed per render), so deriving the year
 * from it is hydration-safe; a hardcoded fallback year covers ad-hoc
 * builds that don't set it, with no runtime `Date` call either way.
 */
const COPYRIGHT_YEAR = process.env.NEXT_PUBLIC_BUILD_DATE
  ? new Date(process.env.NEXT_PUBLIC_BUILD_DATE).getFullYear()
  : 2026;

/**
 * Premium footer (Sprint 7, made CMS-configurable in Sprints 7.1-7.2 —
 * tagline/newsletter copy/social links/nav-link columns can all be
 * published from Content Management → Footer, each falling back to
 * today's hardcoded defaults until an admin publishes a non-empty list).
 * The newsletter form is still UI-only — there's no newsletter backend in
 * this environment and the brief says not to add new Firebase/business
 * logic this sprint, so "subscribing" just shows a local success state
 * rather than writing anywhere, disclosed here.
 */
export function SiteFooter() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const footer = useFooterContent();
  const socialLinks = footer.socialLinks ?? DEFAULT_SOCIAL_LINKS;
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const companyLinks = footer.companyLinks ?? [
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.safety"), href: "/safety" },
    { label: t("nav.becomeDriver"), href: "/become-a-driver" },
  ];

  const serviceLinks = footer.serviceLinks ?? [
    { label: t("nav.services"), href: "/services" },
    { label: t("website.services.airportTitle"), href: "/services" },
    { label: t("website.services.corporateTitle"), href: "/services" },
  ];

  const supportLinks = footer.supportLinks ?? [
    { label: t("nav.faq"), href: "/faq" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  const legalLinks = footer.legalLinks ?? [
    { label: t("nav.privacy"), href: "/privacy-policy" },
    { label: t("nav.terms"), href: "/terms-of-service" },
    { label: t("nav.cookies"), href: "/cookies" },
  ];

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  }

  if (isAppShellRoute(pathname)) {
    return null;
  }

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="laptop:grid-cols-[1.3fr_1fr_1fr_1fr_1.2fr] grid gap-10">
          <div className="flex flex-col gap-3">
            {footer.logoImageUrl ? (
              <span className="flex items-center gap-2">
                <img src={footer.logoImageUrl} alt="" className="h-8 w-auto object-contain" />
                {footer.logoText && (
                  <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    {footer.logoText}
                  </span>
                )}
              </span>
            ) : (
              <Logo withWordmark className="text-neutral-900 dark:text-neutral-50" />
            )}
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{footer.tagline}</p>
            <div className="mt-2 flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  aria-label={social.label}
                  className="hover:bg-brand flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:text-white dark:bg-neutral-800 dark:text-neutral-300"
                >
                  <Icon name={social.icon as IconName} size={16} />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title={t("footer.company")} links={companyLinks} />
          <FooterColumn title={t("footer.servicesColumn")} links={serviceLinks} />
          <FooterColumn title={t("footer.support")} links={supportLinks} />

          {footer.showNewsletter && (
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                {footer.newsletterTitle}
              </p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {footer.newsletterBody}
              </p>
              {subscribed ? (
                <p className="text-success mt-3 flex items-center gap-2 text-sm font-medium">
                  <Icon name="checkCircle" size={16} />
                  {t("footer.newsletterSuccess")}
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="mt-3 flex gap-2">
                  <Input
                    label={t("footer.newsletterPlaceholder")}
                    aria-label={t("footer.newsletterPlaceholder")}
                    placeholder={t("footer.newsletterPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    className="text-sm"
                  />
                  <Button type="submit" size="sm">
                    {t("footer.newsletterCta")}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="mt-10">
          <p className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {t("footer.legal")}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-brand text-sm text-neutral-500 transition-colors dark:text-neutral-400"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Divider />
      <div className="tablet:flex-row mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-neutral-400 dark:text-neutral-500">
        <p>
          {footer.copyrightText ||
            `© ${COPYRIGHT_YEAR} ${t("common.appName")} — ${t("footer.rights")}`}
        </p>
        <p>v{RELEASE_VERSION_STRING}</p>
      </div>
      {process.env.NEXT_PUBLIC_APP_ENV === "development" && (
        <div className="border-t border-dashed border-neutral-200 bg-neutral-50 py-2 text-center font-mono text-[10px] text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-600">
          DEV BUILD {process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "unknown"}
          {/* UX-2 sprint, Part 1 — NEXT_PUBLIC_BUILD_DATE is only ever a
              real, pre-set env var now (see next.config.ts), never a
              runtime Date() fallback; an ad-hoc build that skipped
              scripts/deploy-hosting.mjs simply has none, so this omits the
              dash entirely rather than rendering a trailing "— " with
              nothing after it. */}
          {process.env.NEXT_PUBLIC_BUILD_DATE &&
            ` — ${process.env.NEXT_PUBLIC_BUILD_DATE.replace("T", " ").slice(0, 16)}`}
        </div>
      )}
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((link, index) => (
          <li key={`${link.href}-${index}`}>
            <Link
              href={link.href}
              className="hover:text-brand text-sm text-neutral-500 transition-colors dark:text-neutral-400"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
