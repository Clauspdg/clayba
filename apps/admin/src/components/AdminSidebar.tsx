"use client";

import { Logo, Sidebar, useTranslation, type SidebarNavGroup } from "@the-ride/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ContentManagementNavGroup } from "./ContentManagementNavGroup";

/**
 * UX Simplification sprint, Part 7 — was a single flat list of 17 equally-
 * weighted items (plus the Content Management footer group), which reads
 * as noise rather than a hierarchy. Regrouped into OVERVIEW/OPERATIONS/
 * PEOPLE/FINANCE/SAFETY & SUPPORT/SYSTEM using the same `Sidebar` `groups`
 * mechanism the Passenger and Driver shells already use — every existing
 * route is still exactly where it was, just under a label that says what
 * kind of thing it is.
 */
export function AdminSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const withActive = (
    items: { label: string; href: string; icon: SidebarNavGroup["items"][number]["icon"] }[],
  ) => items.map((item) => ({ ...item, active: pathname === item.href }));

  const groups: SidebarNavGroup[] = [
    {
      label: t("admin.sidebar.groupOverview"),
      items: withActive([{ label: t("admin.sidebar.dashboard"), href: "/", icon: "dashboard" }]),
    },
    {
      label: t("admin.sidebar.groupOperations"),
      items: withActive([
        { label: t("admin.sidebar.dispatchCenter"), href: "/dispatch-center", icon: "monitor" },
        { label: t("admin.sidebar.trips"), href: "/trips", icon: "mapPin" },
        {
          label: t("admin.sidebar.dispatchSettings"),
          href: "/dispatch-settings",
          icon: "navigation",
        },
        { label: t("admin.sidebar.vehicleCategories"), href: "/vehicle-categories", icon: "car" },
        {
          label: t("admin.sidebar.fareConfiguration"),
          href: "/fare-configuration",
          icon: "dollarSign",
        },
      ]),
    },
    {
      label: t("admin.sidebar.groupPeople"),
      items: withActive([
        { label: t("admin.sidebar.drivers"), href: "/drivers", icon: "car" },
        { label: t("admin.sidebar.passengers"), href: "/passengers", icon: "users" },
        { label: t("admin.sidebar.users"), href: "/users", icon: "users" },
      ]),
    },
    {
      label: t("admin.sidebar.groupFinance"),
      items: withActive([
        { label: t("admin.sidebar.payments"), href: "/payments", icon: "creditCard" },
        { label: t("admin.sidebar.wallet"), href: "/wallet", icon: "wallet" },
      ]),
    },
    {
      label: t("admin.sidebar.groupSafetySupport"),
      items: withActive([
        { label: t("admin.sidebar.reports"), href: "/reports", icon: "flag" },
        { label: t("admin.sidebar.support"), href: "/support", icon: "lifeBuoy" },
      ]),
    },
    {
      label: t("admin.sidebar.groupSystem"),
      items: withActive([
        { label: t("admin.sidebar.analytics"), href: "/analytics", icon: "lineChart" },
        { label: t("admin.sidebar.auditLogs"), href: "/audit-logs", icon: "fileText" },
        { label: t("admin.sidebar.permissions"), href: "/permissions", icon: "shieldCheck" },
        { label: t("admin.sidebar.settings"), href: "/settings", icon: "settings" },
      ]),
    },
  ];

  return (
    <Sidebar
      linkComponent={Link}
      header={<Logo withWordmark className="text-neutral-900 dark:text-neutral-50" />}
      groups={groups}
      footer={<ContentManagementNavGroup pathname={pathname} />}
      mobileMenuLabel={t("nav.menu")}
      mobileMenuCloseLabel={t("common.close")}
    />
  );
}
