"use client";

import { Logo, Sidebar, useTranslation, type SidebarNavGroup } from "@the-ride/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DriverNavGroup } from "./DriverNavGroup";

/**
 * UX Simplification sprint, Part 3 — regrouped from a single flat 9-item
 * list into MAIN/ACCOUNT/SUPPORT sections (the same `Sidebar` `groups`
 * mechanism the Driver Space already uses), so the nav reads as a
 * hierarchy instead of a wall of equally-weighted links. No item removed
 * or hidden — every route is still one click away, just under a label
 * that says what kind of thing it is.
 */
export function PassengerSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const withActive = (
    items: { label: string; href: string; icon: SidebarNavGroup["items"][number]["icon"] }[],
  ) => items.map((item) => ({ ...item, active: pathname === item.href }));

  const groups: SidebarNavGroup[] = [
    {
      label: t("passengerNav.groupMain"),
      items: withActive([
        { label: t("passengerNav.dashboard"), href: "/dashboard", icon: "dashboard" },
        { label: t("passengerNav.bookRide"), href: "/book", icon: "car" },
        { label: t("passengerNav.rideHistory"), href: "/rides", icon: "mapPin" },
      ]),
    },
    {
      label: t("passengerNav.groupAccount"),
      items: withActive([
        { label: t("passengerNav.wallet"), href: "/wallet", icon: "wallet" },
        { label: t("passengerNav.savedPlaces"), href: "/saved-places", icon: "flag" },
        { label: t("passengerNav.notifications"), href: "/notifications", icon: "bell" },
        { label: t("passengerNav.profile"), href: "/profile", icon: "users" },
      ]),
    },
    {
      label: t("passengerNav.groupSupport"),
      items: withActive([
        { label: t("passengerNav.support"), href: "/support", icon: "lifeBuoy" },
        { label: t("passengerNav.settings"), href: "/settings", icon: "settings" },
      ]),
    },
  ];

  return (
    <Sidebar
      linkComponent={Link}
      header={<Logo withWordmark className="text-neutral-900 dark:text-neutral-50" />}
      groups={groups}
      footer={<DriverNavGroup pathname={pathname} />}
      mobileMenuLabel={t("nav.menu")}
      mobileMenuCloseLabel={t("common.close")}
    />
  );
}
