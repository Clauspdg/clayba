"use client";

import { webFirestore } from "@/lib/firebase-client";
import { getOrCreatePassengerProfile, updatePassengerPreferences } from "@the-ride/firebase/client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorState,
  Heading,
  LoadingState,
  Select,
  Switch,
  ThemeSwitcher,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { useAuth, LOCALES, LOCALE_LABELS } from "@the-ride/hooks";
import type { PassengerPreferences } from "@the-ride/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { t, setLocale } = useTranslation();
  const { session, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [preferences, setPreferences] = useState<PassengerPreferences | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    getOrCreatePassengerProfile(webFirestore, session.uid)
      .then((profile) => setPreferences(profile.preferences))
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : String(err)));
  }, [session]);

  if (loadError) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={loadError} />;
  }

  if (!session || preferences === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  async function savePreference(patch: Partial<PassengerPreferences>) {
    if (!session || !preferences) return;
    const next = { ...preferences, ...patch };
    setPreferences(next);
    try {
      await updatePassengerPreferences(webFirestore, session.uid, patch);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    }
  }

  async function handleLanguageChange(next: string) {
    setLocale(next as (typeof LOCALES)[number]);
    await savePreference({ language: next });
  }

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Heading level={2}>{t("passengerNav.settings")}</Heading>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.appearance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher
            lightLabel={t("common.light")}
            darkLabel={t("common.dark")}
            systemLabel={t("common.system")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            label={t("settings.language")}
            value={preferences.language}
            onValueChange={(next) => void handleLanguageChange(next)}
            options={LOCALES.map((code) => ({ value: code, label: LOCALE_LABELS[code] }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.privacy")}</CardTitle>
          <CardDescription>{t("settings.privacyDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Switch
            label={t("settings.notifications")}
            checked={preferences.notificationsEnabled}
            onCheckedChange={(checked) => void savePreference({ notificationsEnabled: checked })}
          />
          <Switch
            label={t("settings.smsNotifications")}
            checked={preferences.smsEnabled}
            onCheckedChange={(checked) => void savePreference({ smsEnabled: checked })}
          />
          <Switch
            label={t("settings.quietRideDefault")}
            checked={preferences.quietRideDefault}
            onCheckedChange={(checked) => void savePreference({ quietRideDefault: checked })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Button variant="destructive" onClick={() => void handleLogout()}>
            {t("passengerNav.logout")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
