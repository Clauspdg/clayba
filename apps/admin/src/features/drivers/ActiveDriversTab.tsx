"use client";

import { reactivateDriver, suspendDriver } from "@/lib/driver-admin";
import { adminFirestore } from "@/lib/firebase-client";
import { exportToCsv } from "@/lib/csv";
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
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { DriverAccountStatus, type Driver } from "@the-ride/types";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  active: "success",
  suspended: "warning",
  terminated: "danger",
};

export function ActiveDriversTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<Driver | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(adminFirestore, "drivers"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => setDrivers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Driver)),
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  const table = useTableState({
    data: drivers ?? [],
    searchFields: ["userId", "vehicleId"],
    pageSize: 10,
  });

  async function handleSuspend() {
    if (!suspending) return;
    setBusyId(suspending.id);
    try {
      await suspendDriver(adminFirestore, suspending.id);
      toast({ variant: "success", title: t("admin.drivers.suspended") });
      setSuspending(null);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReactivate(driver: Driver) {
    setBusyId(driver.id);
    try {
      await reactivateDriver(adminFirestore, driver.id);
      toast({ variant: "success", title: t("admin.drivers.reactivated") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  function handleExport() {
    exportToCsv(
      "drivers",
      table.pageItems.map((driver) => ({
        id: driver.id,
        userId: driver.userId,
        status: driver.status,
        availabilityStatus: driver.availabilityStatus,
        rating: driver.rating,
        score: driver.score,
        completedTrips: driver.completedTrips,
        vehicleId: driver.vehicleId ?? "",
      })),
    );
  }

  if (error) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />;
  }

  if (drivers === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <SearchBar
          label={t("common.search")}
          placeholder={t("common.searchPlaceholder")}
          value={table.search}
          onChange={(e) => table.setSearch(e.target.value)}
        />
        <Select
          label={t("admin.drivers.status")}
          placeholder={t("admin.table.allStatuses")}
          value={table.filters.status ?? ""}
          onValueChange={(value) => table.setFilter("status", value)}
          options={Object.values(DriverAccountStatus).map((status) => ({
            value: status,
            label: status,
          }))}
        />
        <Button variant="outline" onClick={table.clearFilters}>
          {t("admin.table.clearFilters")}
        </Button>
        <Button variant="secondary" onClick={handleExport} disabled={table.pageItems.length === 0}>
          {t("admin.table.exportCsv")}
        </Button>
      </div>

      {table.totalCount === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("admin.drivers.noDrivers")}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.drivers.driverName")}</TableHead>
                <TableHead>{t("admin.drivers.status")}</TableHead>
                <TableHead>{t("admin.drivers.vehicle")}</TableHead>
                <TableHead>{t("admin.drivers.rating")}</TableHead>
                <TableHead>{t("admin.drivers.score")}</TableHead>
                <TableHead>{t("admin.drivers.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageItems.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>{driver.userId}</TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[driver.status] ?? "neutral"}>{driver.status}</Badge>
                  </TableCell>
                  <TableCell>{driver.vehicleId ?? "—"}</TableCell>
                  <TableCell>{driver.rating.toFixed(1)}</TableCell>
                  <TableCell>{driver.score}</TableCell>
                  <TableCell>
                    {driver.status === DriverAccountStatus.SUSPENDED ? (
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={busyId === driver.id}
                        onClick={() => void handleReactivate(driver)}
                      >
                        {t("admin.drivers.reactivate")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        isLoading={busyId === driver.id}
                        onClick={() => setSuspending(driver)}
                      >
                        {t("admin.drivers.suspend")}
                      </Button>
                    )}
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

      <Dialog open={Boolean(suspending)} onOpenChange={(open) => !open && setSuspending(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("admin.drivers.suspendTitle")}</DialogTitle>
            <DialogDescription>{t("admin.drivers.suspendDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspending(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleSuspend()}
              isLoading={busyId === suspending?.id}
            >
              {t("admin.drivers.suspend")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
