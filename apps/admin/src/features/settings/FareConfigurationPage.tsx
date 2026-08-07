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

interface FareForm {
  commissionRatePct: number;
  bookingFee: number;
  serviceFeeRatePct: number;
  cancellationFee: number;
  waitingFeePerMinute: number;
  taxRatePct: number;
  surgeMultiplierDefault: number;
  currency: string;
  country: string;
}

function toForm(
  settings: Pick<
    PlatformSettings,
    | "commissionRate"
    | "bookingFee"
    | "serviceFeeRate"
    | "cancellationFee"
    | "waitingFeePerMinute"
    | "taxRate"
    | "surgeMultiplierDefault"
    | "currency"
    | "country"
  >,
): FareForm {
  return {
    commissionRatePct: settings.commissionRate * 100,
    bookingFee: settings.bookingFee,
    serviceFeeRatePct: settings.serviceFeeRate * 100,
    cancellationFee: settings.cancellationFee,
    waitingFeePerMinute: settings.waitingFeePerMinute,
    taxRatePct: settings.taxRate * 100,
    surgeMultiplierDefault: settings.surgeMultiplierDefault,
    currency: settings.currency,
    country: settings.country,
  };
}

/**
 * Fare Configuration (Web Phase W1, Parts 5-6) — real editable form wired
 * to `settings/global` via `updateGlobalSettings`, replacing the earlier
 * read-only `DEFAULT_PLATFORM_SETTINGS` display.
 */
export function FareConfigurationPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { session } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FareForm>(toForm(DEFAULT_PLATFORM_SETTINGS));
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
        commissionRate: form.commissionRatePct / 100,
        bookingFee: form.bookingFee,
        serviceFeeRate: form.serviceFeeRatePct / 100,
        cancellationFee: form.cancellationFee,
        waitingFeePerMinute: form.waitingFeePerMinute,
        taxRate: form.taxRatePct / 100,
        surgeMultiplierDefault: form.surgeMultiplierDefault,
        currency: form.currency,
        country: form.country,
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
      <Heading level={2}>{t("admin.sidebar.fareConfiguration")}</Heading>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.fareConfig.title")}</CardTitle>
          <CardDescription>{t("admin.fareConfig.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="tablet:grid-cols-2 grid gap-4">
            <Input
              type="number"
              step="0.1"
              label={`${t("admin.fareConfig.commissionRate")} (%)`}
              value={form.commissionRatePct}
              onChange={(e) => setForm({ ...form, commissionRatePct: Number(e.target.value) })}
            />
            <Input
              type="number"
              step="0.01"
              label={t("admin.fareConfig.bookingFee")}
              value={form.bookingFee}
              onChange={(e) => setForm({ ...form, bookingFee: Number(e.target.value) })}
            />
            <Input
              type="number"
              step="0.1"
              label={`${t("admin.fareConfig.serviceFeeRate")} (%)`}
              value={form.serviceFeeRatePct}
              onChange={(e) => setForm({ ...form, serviceFeeRatePct: Number(e.target.value) })}
            />
            <Input
              type="number"
              step="0.01"
              label={t("admin.fareConfig.cancellationFee")}
              value={form.cancellationFee}
              onChange={(e) => setForm({ ...form, cancellationFee: Number(e.target.value) })}
            />
            <Input
              type="number"
              step="0.01"
              label={t("admin.fareConfig.waitingFeePerMinute")}
              value={form.waitingFeePerMinute}
              onChange={(e) => setForm({ ...form, waitingFeePerMinute: Number(e.target.value) })}
            />
            <Input
              type="number"
              step="0.1"
              label={`${t("admin.fareConfig.taxRate")} (%)`}
              value={form.taxRatePct}
              onChange={(e) => setForm({ ...form, taxRatePct: Number(e.target.value) })}
            />
            <Input
              type="number"
              step="0.1"
              label={t("admin.fareConfig.surgeMultiplier")}
              value={form.surgeMultiplierDefault}
              onChange={(e) => setForm({ ...form, surgeMultiplierDefault: Number(e.target.value) })}
            />
            <Input
              label={t("admin.fareConfig.currency")}
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
              maxLength={3}
            />
            <Input
              label={t("admin.fareConfig.country")}
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
              maxLength={2}
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
