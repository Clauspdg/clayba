"use client";

import {
  activateApplication,
  advanceApplication,
  getApplicationActions,
  rejectApplication,
} from "@/lib/driver-admin";
import { adminFirestore } from "@/lib/firebase-client";
import { useTableState } from "@/lib/useTableState";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  Illustration,
  LoadingState,
  Pagination,
  SearchBar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import { DriverApplicationStatus, type DriverApplication } from "@the-ride/types";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

const PENDING_STATUSES = [
  DriverApplicationStatus.SUBMITTED,
  DriverApplicationStatus.DOCUMENTS_PENDING,
  DriverApplicationStatus.BACKGROUND_CHECK,
  DriverApplicationStatus.VEHICLE_INSPECTION,
  DriverApplicationStatus.INTERVIEW,
  DriverApplicationStatus.APPROVED,
];

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  submitted: "neutral",
  documents_pending: "brand",
  background_check: "brand",
  vehicle_inspection: "brand",
  interview: "brand",
  approved: "success",
  rejected: "danger",
};

export function ApplicationsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { session } = useAuth();
  const [applications, setApplications] = useState<DriverApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<DriverApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Release-blocking bug fix — a real application submitted today after
     * sitting as a draft for days (`createdAt` from when the draft was
     * first started) sorted dead last behind same-day QA fixture data and
     * was invisible without manually paginating past it. `submittedAt` is
     * set exactly once, at the draft -> submitted transition
     * (`submitApplication` in `packages/firebase/src/client/`), and is
     * never touched by any later admin transition — every document this
     * query can return (every `PENDING_STATUSES` value requires having
     * passed through `submitted` first) is guaranteed to have one. It's
     * also the semantically correct signal for "when did this actually
     * enter the review queue," which `createdAt` is not once a draft can
     * sit unfinished for days before being submitted. Needs its own
     * composite index (`status` + `submittedAt`) — see
     * firestore.indexes.json.
     */
    const q = query(
      collection(adminFirestore, "driverApplications"),
      where("status", "in", PENDING_STATUSES),
      orderBy("submittedAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) =>
        setApplications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as DriverApplication)),
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  const table = useTableState({
    data: applications ?? [],
    searchFields: ["userId", "status"],
    pageSize: 10,
  });

  async function handleAdvance(application: DriverApplication, to: DriverApplicationStatus) {
    setBusyId(application.id);
    try {
      if (to === DriverApplicationStatus.ACTIVATED) {
        await activateApplication(adminFirestore, application, session?.uid ?? "");
        toast({ variant: "success", title: t("admin.drivers.activated") });
      } else {
        await advanceApplication(adminFirestore, application, to);
        toast({ variant: "success", title: t("admin.drivers.advanced") });
      }
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejecting) return;
    setBusyId(rejecting.id);
    try {
      await rejectApplication(adminFirestore, rejecting, rejectionReason);
      toast({ variant: "success", title: t("admin.drivers.rejected") });
      setRejecting(null);
      setRejectionReason("");
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />;
  }

  if (applications === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        label={t("common.search")}
        placeholder={t("common.searchPlaceholder")}
        value={table.search}
        onChange={(e) => table.setSearch(e.target.value)}
      />

      {table.totalCount === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("admin.drivers.noApplications")}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.drivers.applicant")}</TableHead>
                <TableHead>{t("admin.drivers.status")}</TableHead>
                <TableHead>{t("admin.drivers.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageItems.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    {application.personalInfo
                      ? `${application.personalInfo.firstName} ${application.personalInfo.lastName}`
                      : application.userId}
                  </TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[application.status] ?? "neutral"}>
                      {t(`becomeDriver.status${toPascal(application.status)}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {getApplicationActions(application.status).map((next) => (
                        <Button
                          key={next}
                          size="sm"
                          variant="outline"
                          isLoading={busyId === application.id}
                          onClick={() => void handleAdvance(application, next)}
                        >
                          {next === DriverApplicationStatus.ACTIVATED
                            ? t("admin.drivers.activate")
                            : t("admin.drivers.advance")}
                        </Button>
                      ))}
                      {application.status !== DriverApplicationStatus.REJECTED && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejecting(application)}
                        >
                          {t("admin.drivers.reject")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={table.page}
            pageCount={table.pageCount}
            onPageChange={table.setPage}
            previousLabel={t("common.previous")}
            nextLabel={t("common.next")}
            summary={t("admin.table.pageSummary", { current: table.page, total: table.pageCount })}
          />
        </>
      )}

      <Dialog open={Boolean(rejecting)} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("admin.drivers.rejectTitle")}</DialogTitle>
            <DialogDescription>{t("admin.drivers.rejectDescription")}</DialogDescription>
          </DialogHeader>
          <Textarea
            label={t("admin.drivers.rejectionReason")}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleReject()}
              isLoading={busyId === rejecting?.id}
              disabled={!rejectionReason.trim()}
            >
              {t("admin.drivers.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function toPascal(value: string): string {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join("");
}
