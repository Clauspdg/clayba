"use client";

import { Logo, Sidebar, useTranslation } from "@the-ride/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DriverNavGroup } from "./DriverNavGroup";

/** Passenger dashboard nav (Sprint 6) — mirrors `apps/admin/src/components/AdminSidebar.tsx`'s pattern exactly. */
export function PassengerSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const items = (
    [
      { label: t("passengerNav.dashboard"), href: "/dashboard", icon: "dashboard" },
      { label: t("passengerNav.bookRide"), href: "/book", icon: "car" },
      { label: t("passengerNav.rideHistory"), href: "/rides", icon: "mapPin" },
      { label: t("passengerNav.wallet"), href: "/wallet", icon: "wallet" },
      { label: t("passengerNav.notifications"), href: "/notifications", icon: "bell" },
      { label: t("passengerNav.savedPlaces"), href: "/saved-places", icon: "flag" },
      { label: t("passengerNav.profile"), href: "/profile", icon: "users" },
      { label: t("passengerNav.support"), href: "/support", icon: "lifeBuoy" },
      { label: t("passengerNav.settings"), href: "/settings", icon: "settings" },
    ] as const
  ).map((item) => ({ ...item, active: pathname === item.href }));

  return (
    <Sidebar
      linkComponent={Link}
      header={<Logo withWordmark className="text-neutral-900 dark:text-neutral-50" />}
      items={items}
      footer={<DriverNavGroup pathname={pathname} />}
      mobileMenuLabel={t("nav.menu")}
      mobileMenuCloseLabel={t("common.close")}
    />
  );
}
