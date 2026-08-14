"use client";

import {
  Avatar,
  Button,
  Icon,
  IconButton,
  LanguageSelector,
  ThemeSwitcher,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import Link from "next/link";

import { DriverStatusBadge } from "./DriverStatusBadge";
import { useUserExperience } from "@/hooks/useUserExperience";

/**
 * UX-3 sprint (Dedicated Driver Space), Part 3 — mirrors `PassengerHeader`'s
 * pattern with one addition: the driver's real operational status is the
 * most visible thing in the whole shell (Part 4 calls Go Online/Offline
 * "the most important control on the page"), so it's pinned in the header
 * on every Driver Space page, not just Driver Home. "Switch to Passenger"
 * (Part 15) lives here too — a driver's passenger capability is always one
 * click away from wherever they are in the Driver Space.
 */
export function DriverHeader() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const { driver, capabilities } = useUserExperience();
  const label = session?.displayName ?? session?.email ?? "";

  return (
    <header className="flex h-16 shrink-0 flex-wrap items-center justify-end gap-3 border-b border-neutral-200 bg-white px-6 dark:border-neutral-800 dark:bg-neutral-950">
      {driver && <DriverStatusBadge driver={driver} />}
      {capabilities?.canUsePassengerExperience && (
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <Icon name="users" size={16} />
            {t("driverSpace.switchToPassenger")}
          </Link>
        </Button>
      )}
      <ThemeSwitcher
        lightLabel={t("common.light")}
        darkLabel={t("common.dark")}
        systemLabel={t("common.system")}
      />
      <LanguageSelector label={t("common.selectLanguage")} />
      {session && (
        <Avatar
          src={session.photoURL ?? undefined}
          alt={label}
          fallback={label
            .split(/[\s@.]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase()}
        />
      )}
      <IconButton label={t("passengerNav.logout")} onClick={() => void signOut()}>
        <Icon name="logOut" size={18} />
      </IconButton>
    </header>
  );
}
