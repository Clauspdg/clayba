"use client";

import { Logo, Sidebar, useTranslation } from "@the-ride/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ContentManagementNavGroup } from "./ContentManagementNavGroup";

export function AdminSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const items = (
    [
      { label: t("admin.sidebar.dashboard"), href: "/", icon: "dashboard" },
      { label: t("admin.sidebar.drivers"), href: "/drivers", icon: "car" },
      { label: t("admin.sidebar.passengers"), href: "/passengers", icon: "users" },
      { label: t("admin.sidebar.trips"), href: "/trips", icon: "mapPin" },
      { label: t("admin.sidebar.dispatchCenter"), href: "/dispatch-center", icon: "monitor" },
      { label: t("admin.sidebar.vehicleCategories"), href: "/vehicle-categories", icon: "car" },
      {
        label: t("admin.sidebar.fareConfiguration"),
        href: "/fare-configuration",
        icon: "dollarSign",
      },
      {
        label: t("admin.sidebar.dispatchSettings"),
        href: "/dispatch-settings",
        icon: "navigation",
      },
      { label: t("admin.sidebar.payments"), href: "/payments", icon: "creditCard" },
      { label: t("admin.sidebar.wallet"), href: "/wallet", icon: "wallet" },
      { label: t("admin.sidebar.reports"), href: "/reports", icon: "flag" },
      { label: t("admin.sidebar.support"), href: "/support", icon: "lifeBuoy" },
      { label: t("admin.sidebar.settings"), href: "/settings", icon: "settings" },
      { label: t("admin.sidebar.analytics"), href: "/analytics", icon: "lineChart" },
      { label: t("admin.sidebar.auditLogs"), href: "/audit-logs", icon: "fileText" },
      { label: t("admin.sidebar.users"), href: "/users", icon: "users" },
      { label: t("admin.sidebar.permissions"), href: "/permissions", icon: "shieldCheck" },
    ] as const
  ).map((item) => ({ ...item, active: pathname === item.href }));

  return (
    <Sidebar
      linkComponent={Link}
      header={<Logo withWordmark className="text-neutral-900 dark:text-neutral-50" />}
      items={items}
      footer={<ContentManagementNavGroup pathname={pathname} />}
    />
  );
}
