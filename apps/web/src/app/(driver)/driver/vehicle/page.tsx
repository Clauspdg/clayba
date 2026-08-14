"use client";

import { webFirestore } from "@/lib/firebase-client";
import { useUserExperience } from "@/hooks/useUserExperience";
import { getVehicle } from "@the-ride/firebase/client";
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Heading,
  Illustration,
  LoadingState,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { VehicleStatus, type Vehicle } from "@the-ride/types";
import { useEffect, useState } from "react";

const STATUS_TONE: Record<VehicleStatus, "success" | "warning" | "danger" | "neutral"> = {
  [VehicleStatus.APPROVED]: "success",
  [VehicleStatus.ACTIVE]: "success",
  [VehicleStatus.PENDING]: "warning",
  [VehicleStatus.REJECTED]: "danger",
  [VehicleStatus.INACTIVE]: "neutral",
};

/** UX-3 sprint (Dedicated Driver Space), Part 10 — the driver's own approved vehicle, read-only. No self-service vehicle-swap flow exists yet (disclosed, not invented). */
export default function DriverVehiclePage() {
  const { t, locale } = useTranslation();
  const { driver } = useUserExperience();
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);

  useEffect(() => {
    if (!driver) return;
    if (!driver.vehicleId) {
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

  if (!driver || vehicle === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col gap-6">
        <Heading level={1}>{t("driverSpace.nav.vehicle")}</Heading>
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("driverSpace.vehicle.noneTitle")}
          description={t("driverSpace.vehicle.noneBody")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <Heading level={1}>{t("driverSpace.nav.vehicle")}</Heading>
        <Badge tone={STATUS_TONE[vehicle.status]}>
          {t(`driverSpace.vehicleStatus.${vehicle.status}`)}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {vehicle.make} {vehicle.model} ({vehicle.year})
          </CardTitle>
        </CardHeader>
        <CardContent className="tablet:grid-cols-2 grid gap-4">
          <Field label={t("becomeDriver.vehicleColor")} value={vehicle.color} />
          <Field label={t("becomeDriver.vehiclePlate")} value={vehicle.plateNumber} />
          {vehicle.inspectionExpiresAt && (
            <Field
              label={t("driverSpace.vehicle.inspectionExpiresLabel")}
              value={vehicle.inspectionExpiresAt.toLocaleDateString(locale, {
                dateStyle: "medium",
              })}
            />
          )}
        </CardContent>
      </Card>

      <Alert tone="neutral" title={t("driverSpace.vehicle.changeGapTitle")}>
        {t("driverSpace.vehicle.changeGapBody")}
      </Alert>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Text size="xs" tone="muted">
        {label}
      </Text>
      <Text weight="medium">{value}</Text>
    </div>
  );
}
