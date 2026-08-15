"use client";

import { Logo, Sidebar, useTranslation, type SidebarNavGroup } from "@the-ride/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * UX-3 sprint (Dedicated Driver Space), Part 3 — a completely separate
 * nav tree from `PassengerSidebar`. Regrouped by the UX Simplification
 * sprint (Part 5) into MAIN/ACTIVITY/ACCOUNT/SUPPORT — operational
 * actions (Home, Requests, Current Ride) first, historical/financial
 * (Trips, Earnings) next, then account-management pages, support last —
 * replacing the original HOME/RIDES/FINANCE/DRIVER/ACCOUNT split, which
 * put Trip History next to the two live-operation pages and gave
 * Earnings its own single-item section. Never mixes Passenger nav items
 * in; the reciprocal "Switch to Passenger" link lives in
 * `DriverHeader`/`DriverAccount`, not here, matching how the Passenger
 * sidebar keeps its own "Driver Space" entry in a separate footer slot
 * rather than inline.
 */
export function DriverSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const withActive = (
    items: { label: string; href: string; icon: SidebarNavGroup["items"][number]["icon"] }[],
  ) => items.map((item) => ({ ...item, active: pathname === item.href }));

  const groups: SidebarNavGroup[] = [
    {
      label: t("driverSpace.nav.groupMain"),
      items: withActive([
        { label: t("driverSpace.nav.home"), href: "/driver", icon: "home" },
        { label: t("driverSpace.nav.requests"), href: "/driver/requests", icon: "bell" },
        {
          label: t("driverSpace.nav.currentRide"),
          href: "/driver/current-ride",
          icon: "navigation",
        },
      ]),
    },
    {
      label: t("driverSpace.nav.groupActivity"),
      items: withActive([
        { label: t("driverSpace.nav.trips"), href: "/driver/trips", icon: "clock" },
        { label: t("driverSpace.nav.earnings"), href: "/driver/earnings", icon: "dollarSign" },
      ]),
    },
    {
      label: t("driverSpace.nav.groupAccount"),
      items: withActive([
        { label: t("driverSpace.nav.vehicle"), href: "/driver/vehicle", icon: "car" },
        { label: t("driverSpace.nav.documents"), href: "/driver/documents", icon: "fileText" },
        { label: t("driverSpace.nav.performance"), href: "/driver/performance", icon: "lineChart" },
        { label: t("driverSpace.nav.account"), href: "/driver/account", icon: "user" },
      ]),
    },
    {
      label: t("driverSpace.nav.groupSupport"),
      items: withActive([
        { label: t("driverSpace.nav.support"), href: "/driver/support", icon: "lifeBuoy" },
      ]),
    },
  ];

  return (
    <Sidebar
      linkComponent={Link}
      header={<Logo withWordmark className="text-neutral-900 dark:text-neutral-50" />}
      groups={groups}
      mobileMenuLabel={t("nav.menu")}
      mobileMenuCloseLabel={t("common.close")}
    />
  );
}
