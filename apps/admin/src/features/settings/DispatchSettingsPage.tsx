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
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import { DEFAULT_PLATFORM_SETTINGS, type PlatformSettings } from "@the-ride/types";
import { useEffect, useState } from "react";

interface DispatchForm {
  searchRadiusKm: number;
  assignmentTimeoutSeconds: number;
  maxDriverOffers: number;
  minDriverScore: number;
  minAcceptanceRatePct: number;
  maxCancellationRatePct: number;
  maxActiveJobsPerDriver: number;
}

function toForm(
  settings: Pick<
    PlatformSettings,
    | "searchRadiusKm"
    | "assignmentTimeoutSeconds"
    | "maxDriverOffers"
    | "minDriverScore"
    | "minAcceptanceRate"
    | "maxCancellationRate"
    | "maxActiveJobsPerDriver"
  >,
): DispatchForm {
  return {
    searchRadiusKm: settings.searchRadiusKm,
    assignmentTimeoutSeconds: settings.assignmentTimeoutSeconds,
    maxDriverOffers: settings.maxDriverOffers,
    minDriverScore: settings.minDriverScore,
    minAcceptanceRatePct: settings.minAcceptanceRate * 100,
    maxCancellationRatePct: settings.maxCancellationRate * 100,
    maxActiveJobsPerDriver: settings.maxActiveJobsPerDriver,
  };
}

/**
 * Dispatch Settings (Web Phase W1, Parts 5-6) — real editable form wired
 * to `settings/global` via `updateGlobalSettings`, replacing the earlier
 * read-only `DEFAULT_PLATFORM_SETTINGS` display. Writes the same document
 * `AssignmentSettingsTab` (Dispatch Center) reads live.
 */
export function DispatchSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { session } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DispatchForm>(toForm(DEFAULT_PLATFORM_SETTINGS));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return subscribeGlobalSettings(
      adminFirestore,
      (next) => {
        setSettings(next);
        if (next) setForm(toForm(next));
      },
      (message) => setError(message),
    );
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateGlobalSettings(adminFirestore, session?.uid ?? "", {
        searchRadiusKm: form.searchRadiusKm,
        assignmentTimeoutSeconds: form.assignmentTimeoutSeconds,
        maxDriverOffers: form.maxDriverOffers,
        minDriverScore: form.minDriverScore,
        minAcceptanceRate: form.minAcceptanceRatePct / 100,
        maxCancellationRate: form.maxCancellationRatePct / 100,
        maxActiveJobsPerDriver: form.maxActiveJobsPerDriver,
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
      <Heading level={2}>{t("admin.sidebar.dispatchSettings")}</Heading>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dispatchSettings.title")}</CardTitle>
          <CardDescription>{t("admin.dispatchSettings.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="tablet:grid-cols-2 grid gap-4">
            <Input
              type="number"
              step="0.1"
              label={`${t("admin.dispatchSettings.searchRadius")} (km)`}
              value={form.searchRadiusKm}
              onChange={(e) => setForm({ ...form, searchRadiusKm: Number(e.target.value) })}
            />
            <Input
              type="number"
              label={`${t("admin.dispatchSettings.assignmentTimeout")} (s)`}
              value={form.assignmentTimeoutSeconds}
              onChange={(e) =>
                setForm({ ...form, assignmentTimeoutSeconds: Number(e.target.value) })
              }
            />
            <Input
              type="number"
              label={t("admin.dispatchSettings.maxDriverOffers")}
              value={form.maxDriverOffers}
              onChange={(e) => setForm({ ...form, maxDriverOffers: Number(e.target.value) })}
            />
            <Input
              type="number"
              label={t("admin.assignmentSettings.minDriverScore")}
              value={form.minDriverScore}
              onChange={(e) => setForm({ ...form, minDriverScore: Number(e.target.value) })}
            />
            <Input
              type="number"
              step="0.1"
              label={`${t("admin.assignmentSettings.minAcceptanceRate")} (%)`}
              value={form.minAcceptanceRatePct}
              onChange={(e) => setForm({ ...form, minAcceptanceRatePct: Number(e.target.value) })}
            />
            <Input
              type="number"
              step="0.1"
              label={`${t("admin.assignmentSettings.maxCancellationRate")} (%)`}
              value={form.maxCancellationRatePct}
              onChange={(e) => setForm({ ...form, maxCancellationRatePct: Number(e.target.value) })}
            />
            <Input
              type="number"
              label={t("admin.assignmentSettings.maxActiveJobs")}
              value={form.maxActiveJobsPerDriver}
              onChange={(e) => setForm({ ...form, maxActiveJobsPerDriver: Number(e.target.value) })}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => void handleSave()} isLoading={saving}>
              {t("admin.settingsForm.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
