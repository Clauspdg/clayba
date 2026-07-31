"use client";

import { Avatar, Icon, IconButton, LanguageSelector, ThemeSwitcher, useTranslation } from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";

export function AdminHeader() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const label = session?.displayName ?? session?.email ?? "";

  return (
    <header className="flex h-16 shrink-0 items-center justify-end gap-3 border-b border-neutral-200 bg-white px-6 dark:border-neutral-800 dark:bg-neutral-950">
      <ThemeSwitcher lightLabel={t("common.light")} darkLabel={t("common.dark")} systemLabel={t("common.system")} />
      <LanguageSelector label={t("common.selectLanguage")} />
      {session && (
        <Avatar
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
      <IconButton label={t("admin.header.logout")} onClick={() => void signOut()}>
        <Icon name="logOut" size={18} />
      </IconButton>
    </header>
  );
}
