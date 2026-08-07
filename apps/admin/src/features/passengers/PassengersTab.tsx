"use client";

import { exportToCsv } from "@/lib/csv";
import { adminFirestore } from "@/lib/firebase-client";
import { useTableState } from "@/lib/useTableState";
import { reactivateUser, suspendUser } from "@/lib/user-admin";
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
import { Role, UserStatus, type User } from "@the-ride/types";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  active: "success",
  suspended: "warning",
  deleted: "danger",
};

function formatDate(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toLocaleDateString();
  }
  if (value instanceof Date) return value.toLocaleDateString();
  return "—";
}

export function PassengersTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [passengers, setPassengers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<User | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(adminFirestore, "users"),
      where("role", "==", Role.PASSENGER),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => setPassengers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as User)),
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  const table = useTableState({
    data: passengers ?? [],
    searchFields: ["displayName", "email"],
    pageSize: 10,
  });

  async function handleSuspend() {
    if (!suspending) return;
    setBusyId(suspending.id);
    try {
      await suspendUser(adminFirestore, suspending.id);
      toast({ variant: "success", title: t("admin.passengers.suspended") });
      setSuspending(null);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReactivate(passenger: User) {
    setBusyId(passenger.id);
    try {
      await reactivateUser(adminFirestore, passenger.id);
      toast({ variant: "success", title: t("admin.passengers.reactivated") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  function handleExport() {
    exportToCsv(
      "passengers",
      table.pageItems.map((passenger) => ({
        id: passenger.id,
        name: passenger.displayName ?? "",
        email: passenger.email,
        status: passenger.status,
      })),
    );
  }

  if (error) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />;
  }

  if (passengers === null) {
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
          label={t("admin.passengers.status")}
          placeholder={t("admin.table.allStatuses")}
          value={table.filters.status ?? ""}
          onValueChange={(value) => table.setFilter("status", value)}
          options={Object.values(UserStatus).map((status) => ({ value: status, label: status }))}
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
          title={t("admin.passengers.noPassengers")}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.passengers.name")}</TableHead>
                <TableHead>{t("admin.passengers.email")}</TableHead>
                <TableHead>{t("admin.passengers.status")}</TableHead>
                <TableHead>{t("admin.passengers.joined")}</TableHead>
                <TableHead>{t("admin.passengers.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageItems.map((passenger) => (
                <TableRow key={passenger.id}>
                  <TableCell>{passenger.displayName ?? "—"}</TableCell>
                  <TableCell>{passenger.email}</TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[passenger.status] ?? "neutral"}>
                      {passenger.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(passenger.createdAt)}</TableCell>
                  <TableCell>
                    {passenger.status === UserStatus.SUSPENDED ? (
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={busyId === passenger.id}
                        onClick={() => void handleReactivate(passenger)}
                      >
                        {t("admin.passengers.reactivate")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        isLoading={busyId === passenger.id}
                        onClick={() => setSuspending(passenger)}
                      >
                        {t("admin.passengers.suspend")}
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
            <DialogTitle>{t("admin.passengers.suspendTitle")}</DialogTitle>
            <DialogDescription>{t("admin.passengers.suspendDescription")}</DialogDescription>
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
              {t("admin.passengers.suspend")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
