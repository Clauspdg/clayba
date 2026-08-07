"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { subscribeGlobalSettings, updateGlobalSettings } from "@/lib/settings-admin";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorState,
  Heading,
  Input,
  LoadingState,
  Switch,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import type { PlatformSettings } from "@the-ride/types";
import { useEffect, useState } from "react";

/**
 * General Settings (Web Phase W1, Parts 5-6) — real editable form for the
 * `settings/global` fields not owned by Fare Configuration or Dispatch
 * Settings (`supportEmail`, `maintenanceMode`), replacing the earlier
 * `PlaceholderDashboardPage`.
 */
export function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { session } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [supportEmail, setSupportEmail] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return subscribeGlobalSettings(
      adminFirestore,
      (next) => {
        setSettings(next);
        setSupportEmail(next?.supportEmail ?? "");
        setMaintenanceMode(next?.maintenanceMode ?? false);
      },
      (message) => setError(message),
    );
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateGlobalSettings(adminFirestore, session?.uid ?? "", {
        supportEmail,
        maintenanceMode,
      });
      toast({ variant: "success", title: t("admin.settingsForm.saved") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />;
  }

  if (settings === undefined) {
    return <LoadingState title={t("common.loading")} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.settings")}</Heading>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.generalSettings.title")}</CardTitle>
          <CardDescription>{t("admin.generalSettings.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            type="email"
            label={t("admin.generalSettings.supportEmail")}
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
          />
          <Switch
            label={t("admin.generalSettings.maintenanceMode")}
            checked={maintenanceMode}
            onCheckedChange={setMaintenanceMode}
          />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("admin.generalSettings.maintenanceModeDescription")}
          </p>
          <div className="mt-2 flex justify-end">
            <Button onClick={() => void handleSave()} isLoading={saving}>
              {t("admin.settingsForm.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
