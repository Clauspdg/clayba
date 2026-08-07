"use client";

import {
  Avatar,
  Icon,
  IconButton,
  LanguageSelector,
  ThemeSwitcher,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";

/** Passenger dashboard header (Sprint 6) — mirrors `apps/admin/src/components/AdminHeader.tsx`. */
export function PassengerHeader() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const label = session?.displayName ?? session?.email ?? "";

  return (
    <header className="flex h-16 shrink-0 items-center justify-end gap-3 border-b border-neutral-200 bg-white px-6 dark:border-neutral-800 dark:bg-neutral-950">
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
