"use client";

import { Logo, Sidebar, useTranslation, type SidebarNavGroup } from "@the-ride/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * UX-3 sprint (Dedicated Driver Space), Part 3 — a completely separate
 * nav tree from `PassengerSidebar`, grouped per the spec's HOME/RIDES/
 * FINANCE/DRIVER/ACCOUNT sections (`Sidebar`'s new `groups` prop, added
 * for this — see that component's doc comment). Never mixes Passenger nav
 * items in; the reciprocal "Switch to Passenger" link lives in
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
      label: t("driverSpace.nav.groupHome"),
      items: withActive([{ label: t("driverSpace.nav.home"), href: "/driver", icon: "home" }]),
    },
    {
      label: t("driverSpace.nav.groupRides"),
      items: withActive([
        { label: t("driverSpace.nav.requests"), href: "/driver/requests", icon: "bell" },
        {
          label: t("driverSpace.nav.currentRide"),
          href: "/driver/current-ride",
          icon: "navigation",
        },
        { label: t("driverSpace.nav.trips"), href: "/driver/trips", icon: "clock" },
      ]),
    },
    {
      label: t("driverSpace.nav.groupFinance"),
      items: withActive([
        { label: t("driverSpace.nav.earnings"), href: "/driver/earnings", icon: "dollarSign" },
      ]),
    },
    {
      label: t("driverSpace.nav.groupDriver"),
      items: withActive([
        { label: t("driverSpace.nav.vehicle"), href: "/driver/vehicle", icon: "car" },
        { label: t("driverSpace.nav.documents"), href: "/driver/documents", icon: "fileText" },
        { label: t("driverSpace.nav.performance"), href: "/driver/performance", icon: "lineChart" },
      ]),
    },
    {
      label: t("driverSpace.nav.groupAccount"),
      items: withActive([
        { label: t("driverSpace.nav.support"), href: "/driver/support", icon: "lifeBuoy" },
        { label: t("driverSpace.nav.account"), href: "/driver/account", icon: "user" },
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
