"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { acknowledgeIncident, resolveIncident } from "@/lib/sos-admin";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Illustration,
  LoadingState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
  useTranslation,
  type BadgeProps,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import { subscribeSosIncidents } from "@the-ride/firebase/client";
import { SosIncidentStatus, type SosIncident } from "@the-ride/types";
import { useEffect, useMemo, useState } from "react";

const STATUS_TONE: Record<SosIncidentStatus, NonNullable<BadgeProps["tone"]>> = {
  [SosIncidentStatus.OPEN]: "danger",
  [SosIncidentStatus.ACKNOWLEDGED]: "warning",
  [SosIncidentStatus.RESOLVED]: "success",
};

/**
 * Live SOS-incident board — the admin/dispatch half of the real "Send SOS
 * Alert" pipeline (`triggerSosAlert` Cloud Function → this collection).
 * Structurally modeled on `apps/admin/src/features/trips/LiveRideRequestsTab.tsx`
 * (live `onSnapshot`, three-state render) plus the busy/toast action-button
 * pattern from `apps/admin/src/features/support/SupportTicketsTab.tsx`.
 */
export function SosIncidentsTab() {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const { session } = useAuth();
  const [incidents, setIncidents] = useState<SosIncident[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeSosIncidents(adminFirestore, setIncidents, setError);
  }, []);

  const counters = useMemo(() => {
    const list = incidents ?? [];
    return {
      open: list.filter((i) => i.status === SosIncidentStatus.OPEN).length,
      acknowledged: list.filter((i) => i.status === SosIncidentStatus.ACKNOWLEDGED).length,
    };
  }, [incidents]);

  async function handleAcknowledge(incident: SosIncident) {
    setBusyId(incident.id);
    try {
      await acknowledgeIncident(adminFirestore, incident.id, session?.uid ?? "");
      toast({ variant: "success", title: t("admin.emergency.acknowledged") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolve(incident: SosIncident) {
    setBusyId(incident.id);
    try {
      await resolveIncident(adminFirestore, incident.id, session?.uid ?? "");
      toast({ variant: "success", title: t("admin.emergency.resolved") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />;
  }

  if (incidents === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="tablet:grid-cols-2 grid gap-4">
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-danger text-2xl font-semibold">{counters.open}</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {t("admin.emergency.statusOpen")}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              {counters.acknowledged}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {t("admin.emergency.statusAcknowledged")}
            </span>
          </CardContent>
        </Card>
      </div>

      {incidents.length === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("admin.emergency.noIncidents")}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.emergency.id")}</TableHead>
                  <TableHead>{t("admin.emergency.trip")}</TableHead>
                  <TableHead>{t("admin.emergency.triggeredBy")}</TableHead>
                  <TableHead>{t("admin.emergency.location")}</TableHead>
                  <TableHead>{t("admin.emergency.createdAt")}</TableHead>
                  <TableHead>{t("admin.emergency.status")}</TableHead>
                  <TableHead>{t("admin.emergency.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium text-neutral-900 dark:text-neutral-50">
                      {incident.id}
                    </TableCell>
                    <TableCell>{incident.tripId}</TableCell>
                    <TableCell>
                      {incident.triggeredBy === "passenger"
                        ? t("admin.emergency.triggeredByPassenger")
                        : t("admin.emergency.triggeredByDriver")}
                    </TableCell>
                    <TableCell>
                      {incident.location ? (
                        <a
                          href={`https://maps.google.com/?q=${incident.location.lat},${incident.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand hover:underline"
                        >
                          {t("admin.emergency.openInMaps")}
                        </a>
                      ) : (
                        <span className="text-neutral-500 dark:text-neutral-400">
                          {t("admin.emergency.locationUnavailable")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {incident.createdAt.toLocaleString(locale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge tone={STATUS_TONE[incident.status]}>
                        {t(
                          incident.status === SosIncidentStatus.OPEN
                            ? "admin.emergency.statusOpen"
                            : incident.status === SosIncidentStatus.ACKNOWLEDGED
                              ? "admin.emergency.statusAcknowledged"
                              : "admin.emergency.statusResolved",
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {incident.status === SosIncidentStatus.OPEN && (
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={busyId === incident.id}
                            onClick={() => void handleAcknowledge(incident)}
                          >
                            {t("admin.emergency.acknowledge")}
                          </Button>
                        )}
                        {incident.status !== SosIncidentStatus.RESOLVED && (
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={busyId === incident.id}
                            onClick={() => void handleResolve(incident)}
                          >
                            {t("admin.emergency.resolve")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
