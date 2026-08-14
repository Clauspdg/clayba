"use client";

import { CapabilitySummary } from "@/components/CapabilitySummary";
import { useUserExperience } from "@/hooks/useUserExperience";
import { getVehicle } from "@the-ride/firebase/client";
import { webFirestore } from "@/lib/firebase-client";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Heading,
  Icon,
  LoadingState,
  Select,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { useAuth, LOCALES, LOCALE_LABELS } from "@the-ride/hooks";
import type { Vehicle } from "@the-ride/types";
import { updatePassengerPreferences } from "@the-ride/firebase/client";
import { getOrCreatePassengerProfile } from "@the-ride/firebase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

import { DriverStatusBadge } from "@/components/DriverStatusBadge";

/**
 * UX-3 sprint (Dedicated Driver Space), Part 14 — driver-specific identity
 * (not a duplicate of `/profile`'s account-editing form, which still
 * covers display name/avatar/phone/emergency contacts for the shared
 * account underneath both experiences). Uses the SAME `CapabilitySummary`
 * `/profile` now uses, so a dual passenger+driver user sees identical,
 * truthful capability text in both places.
 */
export default function DriverAccountPage() {
  const { t, setLocale } = useTranslation();
  const { session } = useAuth();
  const { driver, roles, lifecycleState } = useUserExperience();
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);
  const [language, setLanguage] = useState("en");
  const [savingLanguage, setSavingLanguage] = useState(false);

  useEffect(() => {
    if (!session) return;
    void getOrCreatePassengerProfile(webFirestore, session.uid).then((p) =>
      setLanguage(p.preferences.language),
    );
  }, [session]);

  useEffect(() => {
    if (!driver?.vehicleId) {
      setVehicle(null);
      return;
    }
    let cancelled = false;
    getVehicle(webFirestore, driver.vehicleId)
      .then((v) => !cancelled && setVehicle(v))
      .catch(() => !cancelled && setVehicle(null));
    return () => {
      cancelled = true;
    };
  }, [driver]);

  async function handleSaveLanguage(next: string) {
    if (!session) return;
    setLanguage(next);
    setLocale(next as (typeof LOCALES)[number]);
    setSavingLanguage(true);
    try {
      await updatePassengerPreferences(webFirestore, session.uid, { language: next });
    } finally {
      setSavingLanguage(false);
    }
  }

  if (!session || !driver) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  const label = session.displayName ?? session.email ?? "";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Heading level={1}>{t("driverSpace.nav.account")}</Heading>

      <Card>
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="flex items-center gap-4">
            <Avatar
              src={session.photoURL ?? undefined}
              alt={label}
              fallback={(label || "?").charAt(0).toUpperCase()}
              size="lg"
            />
            <div className="flex flex-col gap-0.5">
              <Text weight="medium">{label}</Text>
              <Text size="sm" tone="muted">
                {session.email}
              </Text>
            </div>
          </div>

          <CapabilitySummary roles={roles} lifecycleState={lifecycleState} />

          <div className="flex flex-col gap-1.5">
            <Text size="sm" tone="muted">
              {t("driverSpace.account.driverIdLabel")}
            </Text>
            <Text size="sm" weight="medium">
              {driver.id}
            </Text>
          </div>

          <div className="flex items-center justify-between">
            <Text size="sm" tone="muted">
              {t("driverSpace.home.currentStatusLabel")}
            </Text>
            <DriverStatusBadge driver={driver} />
          </div>

          <div className="flex items-center justify-between">
            <Text size="sm" tone="muted">
              {t("driverSpace.nav.vehicle")}
            </Text>
            {vehicle === undefined ? (
              <Text size="sm">{t("common.loading")}</Text>
            ) : vehicle ? (
              <Badge tone="neutral">
                {vehicle.make} {vehicle.model}
              </Badge>
            ) : (
              <Text size="sm" tone="muted">
                {t("driverSpace.home.noVehicle")}
              </Text>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-8">
          <Text weight="medium">{t("profile.language")}</Text>
          <Select
            label={t("profile.language")}
            value={language}
            onValueChange={(next) => void handleSaveLanguage(next)}
            options={LOCALES.map((code) => ({ value: code, label: LOCALE_LABELS[code] }))}
            disabled={savingLanguage}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/profile">
            <Icon name="user" size={16} />
            {t("profile.title")}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/driver/support">
            <Icon name="lifeBuoy" size={16} />
            {t("driverSpace.nav.support")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
