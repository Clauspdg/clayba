"use client";

import { DocumentThumbnailGrid, type ReviewDocument } from "@/components/DocumentViewer";
import { reactivateDriver, suspendDriver } from "@/lib/driver-admin";
import { adminFirestore } from "@/lib/firebase-client";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorState,
  Icon,
  LoadingState,
  Text,
  useToast,
  useTranslation,
  DRIVER_APPLICATION_STATUS_LABEL_KEY,
  DRIVER_APPLICATION_STATUS_TONE,
} from "@the-ride/ui";
import {
  DriverAccountStatus,
  DriverDocumentType,
  driverApplicationSchema,
  driverSchema,
  vehicleSchema,
  type Driver,
  type DriverApplication,
  type Vehicle,
} from "@the-ride/types";
import { getDocumentComplianceSummary, getDocumentReviewStatus } from "@the-ride/utils";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

const STATUS_TONE: Record<string, "success" | "warning" | "danger"> = {
  active: "success",
  suspended: "warning",
  terminated: "danger",
};

const COMPLIANCE_TONE: Record<string, "success" | "warning" | "neutral"> = {
  complete: "success",
  issues: "warning",
  pending: "neutral",
};

interface Props {
  driverId: string;
  onBack: () => void;
  onViewApplication: (applicationId: string) => void;
}

/**
 * Admin Driver Application Review Workspace sprint, Parts 19-20 — once a
 * driver is activated, their original application must stay reachable
 * with its full review history, not just the bare `drivers/{uid}` record
 * the Active Drivers table showed before. Linkage already existed
 * (`driver.applicationId`, set by `activateApplication` — see
 * `apps/admin/src/lib/driver-admin.ts`); this is the first UI to actually
 * use it. Nothing here deletes or moves the application — it's the exact
 * same `driverApplications/{id}` document `ApplicationReviewWorkspace`
 * reads, just summarized read-only alongside the driver's operational
 * status.
 */
export function DriverDetailWorkspace({ driverId, onBack, onViewApplication }: Props) {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);
  const [application, setApplication] = useState<DriverApplication | null | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [suspending, setSuspending] = useState(false);

  useEffect(() => {
    setDriver(null);
    setNotFound(false);
    setError(null);
    const unsubscribe = onSnapshot(
      doc(adminFirestore, "drivers", driverId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setNotFound(true);
          return;
        }
        try {
          setDriver(driverSchema.parse({ id: snapshot.id, ...snapshot.data() }));
        } catch (err) {
          console.error("[DriverDetailWorkspace] failed to parse driver", err);
          setError(t("admin.documentReview.loadErrorBody"));
        }
      },
      (err) => {
        console.error("[DriverDetailWorkspace] subscription error", err);
        setError(
          err.message.includes("permission")
            ? t("admin.documentReview.permissionDenied")
            : err.message,
        );
      },
    );
    return unsubscribe;
  }, [driverId, t]);

  useEffect(() => {
    if (!driver) return;
    let cancelled = false;

    if (driver.vehicleId) {
      getDoc(doc(adminFirestore, "vehicles", driver.vehicleId))
        .then((snap) => {
          if (cancelled) return;
          setVehicle(snap.exists() ? vehicleSchema.parse({ id: snap.id, ...snap.data() }) : null);
        })
        .catch(() => !cancelled && setVehicle(null));
    } else {
      setVehicle(null);
    }

    getDoc(doc(adminFirestore, "driverApplications", driver.applicationId))
      .then((snap) => {
        if (cancelled) return;
        setApplication(
          snap.exists() ? driverApplicationSchema.parse({ id: snap.id, ...snap.data() }) : null,
        );
      })
      .catch(() => !cancelled && setApplication(null));

    return () => {
      cancelled = true;
    };
  }, [driver]);

  async function handleSuspend() {
    setBusy(true);
    try {
      await suspendDriver(adminFirestore, driverId);
      toast({ variant: "success", title: t("admin.drivers.suspended") });
      setSuspending(false);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusy(false);
    }
  }

  async function handleReactivate() {
    setBusy(true);
    try {
      await reactivateDriver(adminFirestore, driverId);
      toast({ variant: "success", title: t("admin.drivers.reactivated") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton onBack={onBack} t={t} />
        <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton onBack={onBack} t={t} />
        <ErrorState
          title={t("admin.documentReview.notFoundTitle")}
          description={t("admin.documentReview.notFoundBody")}
        />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton onBack={onBack} t={t} />
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  const compliance = getDocumentComplianceSummary(application?.documentReviews);
  const documents: ReviewDocument[] = application
    ? [
        {
          key: DriverDocumentType.DRIVERS_LICENSE,
          label: t("admin.documentReview.documentLicense"),
          url: application.license?.photoUrl,
          reviewStatus: getDocumentReviewStatus(
            application.documentReviews,
            DriverDocumentType.DRIVERS_LICENSE,
          ),
        },
        {
          key: DriverDocumentType.VEHICLE_INSURANCE,
          label: t("admin.documentReview.documentInsurance"),
          url: application.insurance?.photoUrl,
          reviewStatus: getDocumentReviewStatus(
            application.documentReviews,
            DriverDocumentType.VEHICLE_INSURANCE,
          ),
        },
        {
          key: DriverDocumentType.PROFILE_PHOTO,
          label: t("admin.documentReview.documentProfilePhoto"),
          url: application.profilePhotoUrl,
          reviewStatus: getDocumentReviewStatus(
            application.documentReviews,
            DriverDocumentType.PROFILE_PHOTO,
          ),
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton onBack={onBack} t={t} />
        <Badge tone={STATUS_TONE[driver.status] ?? "neutral"}>{driver.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.documentReview.sectionDriverOverview")}</CardTitle>
        </CardHeader>
        <CardContent className="tablet:grid-cols-3 grid gap-4">
          <Stat label={t("admin.documentReview.uid")} value={driver.userId} />
          <Stat label={t("admin.drivers.rating")} value={driver.rating.toFixed(1)} />
          <Stat label={t("admin.drivers.score")} value={String(driver.score)} />
          <Stat
            label={t("admin.documentReview.completedTrips")}
            value={String(driver.completedTrips)}
          />
          <Stat label={t("admin.documentReview.availability")} value={driver.availabilityStatus} />
          <Stat
            label={t("admin.documentReview.activatedSince")}
            value={driver.createdAt.toLocaleDateString(locale, { dateStyle: "medium" })}
          />
          <Stat
            label={t("admin.documentReview.vehicleColumn")}
            value={vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : "—"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.documentReview.sectionApplicationCompliance")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {application === undefined ? (
            <LoadingState title={t("common.loading")} />
          ) : application === null ? (
            <Text tone="muted" size="sm">
              {t("admin.documentReview.noLinkedApplication")}
            </Text>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={DRIVER_APPLICATION_STATUS_TONE[application.status]}>
                  {t(DRIVER_APPLICATION_STATUS_LABEL_KEY[application.status])}
                </Badge>
                <Badge tone={COMPLIANCE_TONE[compliance]}>
                  {t(`admin.documentReview.compliance.${compliance}`)}
                </Badge>
              </div>
              <DocumentThumbnailGrid documents={documents} />
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => onViewApplication(application.id)}
              >
                <Icon name="fileText" size={16} />
                {t("admin.documentReview.viewFullApplication")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.documentReview.sectionActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          {driver.status === DriverAccountStatus.SUSPENDED ? (
            <Button onClick={() => void handleReactivate()} isLoading={busy}>
              {t("admin.drivers.reactivate")}
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setSuspending(true)} disabled={busy}>
              {t("admin.drivers.suspend")}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={suspending} onOpenChange={(open) => !open && setSuspending(false)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("admin.drivers.suspendTitle")}</DialogTitle>
            <DialogDescription>{t("admin.drivers.suspendDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspending(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={() => void handleSuspend()} isLoading={busy}>
              {t("admin.drivers.suspend")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BackButton({ onBack, t }: { onBack: () => void; t: (key: string) => string }) {
  return (
    <Button variant="ghost" size="sm" onClick={onBack} className="w-fit">
      <Icon name="arrowLeft" size={16} />
      {t("admin.documentReview.backToDrivers")}
    </Button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Text size="xs" tone="muted">
        {label}
      </Text>
      <Text size="sm" weight="medium">
        {value}
      </Text>
    </div>
  );
}
