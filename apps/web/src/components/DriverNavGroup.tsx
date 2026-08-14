"use client";

import { Icon, useTranslation } from "@the-ride/ui";
import { getDriverNavLabelKey, isDriverState } from "@the-ride/utils";
import Link from "next/link";

import { useUserExperience } from "@/hooks/useUserExperience";

/**
 * Passenger → Driver entry point sprint, Part 2 (updated by UX-3 —
 * Dedicated Driver Space, Part 25) — a single, separated "Driver" section
 * at the bottom of the Passenger sidebar (rendered through `Sidebar`'s
 * existing `footer` slot, mirroring
 * `apps/admin/src/components/ContentManagementNavGroup.tsx`'s pattern,
 * rather than adding section/group support to the shared `Sidebar` in
 * `packages/ui`). Unlike that admin group this has no expand/collapse —
 * there is exactly one item, whose label AND destination change with
 * lifecycle state: an applicant still goes to `/become-a-driver`, a real
 * driver (active/suspended/inactive) goes to `/driver`. Renders nothing
 * until the resolver has an answer, so it never flashes the wrong label.
 */
export function DriverNavGroup({ pathname }: { pathname: string }) {
  const { t } = useTranslation();
  const { experience } = useUserExperience();

  if (!experience) return null;

  const href = isDriverState(experience) ? "/driver" : "/become-a-driver";
  const active = pathname === href || pathname.startsWith("/driver/");

  return (
    <div className="flex flex-col gap-1 border-t border-neutral-200 pt-3 dark:border-neutral-800">
      <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        {t("becomeDriver.entryPoint.driverSectionLabel")}
      </p>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
          active
            ? "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
        }`}
      >
        <Icon name="car" size={18} className="shrink-0" />
        <span className="truncate">{t(getDriverNavLabelKey(experience))}</span>
      </Link>
    </div>
  );
}
