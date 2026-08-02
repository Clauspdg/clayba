"use client";

import { Icon, useTranslation } from "@the-ride/ui";
import Link from "next/link";
import { useState } from "react";

const SUB_ITEMS = [
  { href: "/content-homepage", labelKey: "admin.sidebar.contentHomepage" },
  { href: "/content-sections", labelKey: "admin.sidebar.contentSections" },
  { href: "/content-media", labelKey: "admin.sidebar.contentMedia" },
  { href: "/content-testimonials", labelKey: "admin.sidebar.contentTestimonials" },
  { href: "/content-faq", labelKey: "admin.sidebar.contentFaq" },
  { href: "/content-footer", labelKey: "admin.sidebar.contentFooter" },
  { href: "/content-downloads", labelKey: "admin.sidebar.contentDownloads" },
  { href: "/content-seo", labelKey: "admin.sidebar.contentSeo" },
] as const;

/**
 * "Content Management" nav group (Sprint 7.1 Site Content CMS). Rendered
 * through `Sidebar`'s existing `footer` slot rather than adding
 * nested-group support to the shared `NavItem`/`Sidebar` in `packages/ui`
 * (which has no such concept today and is used elsewhere too) — see
 * `apps/admin/src/components/AdminSidebar.tsx`. Link styling is copied
 * from `Sidebar.tsx`'s own `<Link>` items rather than imported, since
 * `packages/ui` doesn't export those classes standalone.
 */
export function ContentManagementNavGroup({ pathname }: { pathname: string }) {
  const { t } = useTranslation();
  const isContentRoute = pathname.startsWith("/content-");
  const [open, setOpen] = useState(isContentRoute);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex items-center justify-between gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
      >
        <span className="flex items-center gap-3">
          <Icon name="fileText" size={18} className="shrink-0" />
          {t("admin.sidebar.contentManagement")}
        </span>
        <Icon name={open ? "chevronUp" : "chevronDown"} size={16} />
      </button>
      {open && (
        <div className="flex flex-col gap-1 pl-4">
          {SUB_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
                }`}
              >
                <span className="truncate">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
