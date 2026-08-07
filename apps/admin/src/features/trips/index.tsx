"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { exportToCsv } from "@/lib/csv";
import { useTableState } from "@/lib/useTableState";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Heading,
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
  useTranslation,
} from "@the-ride/ui";
import { TripStatus, type Trip } from "@the-ride/types";
import { collection, limit as fsLimit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  requested: "neutral",
  matched: "brand",
  en_route_to_pickup: "brand",
  arrived: "brand",
  in_progress: "brand",
  completed: "success",
  cancelled: "danger",
};

/**
 * Trips (Web Phase W1, Parts 5-6) — live Firestore list from the `trips`
 * collection, replacing the earlier `SAMPLE_REQUESTS` fixture. Reads
 * `trips` rather than `tripRequests`: the latter's `firestore.rules` read
 * rule only grants the requesting passenger, not admins, so a dashboard
 * query against it would be denied.
 */
export function TripsPage() {
  const { t } = useTranslation();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(adminFirestore, "trips"),
      orderBy("createdAt", "desc"),
      fsLimit(500),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => setTrips(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Trip)),
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  const table = useTableState({
    data: trips ?? [],
    searchFields: ["id", "passengerId", "driverId"],
    pageSize: 10,
  });

  const stats = useMemo(() => {
    const list = trips ?? [];
    return {
      total: list.length,
      active: list.filter(
        (trip) => ![TripStatus.COMPLETED, TripStatus.CANCELLED].includes(trip.status),
      ).length,
      completed: list.filter((trip) => trip.status === TripStatus.COMPLETED).length,
      cancelled: list.filter((trip) => trip.status === TripStatus.CANCELLED).length,
    };
  }, [trips]);

  function handleExport() {
    exportToCsv(
      "trips",
      table.pageItems.map((trip) => ({
        id: trip.id,
        passengerId: trip.passengerId,
        driverId: trip.driverId ?? "",
        status: trip.status,
        fareAmount: trip.fareAmount ?? "",
      })),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.trips")}</Heading>

      <div className="tablet:grid-cols-2 laptop:grid-cols-4 grid gap-4">
        {[
          [t("admin.tripsPage.totalTrips"), stats.total],
          [t("admin.tripsPage.activeTrips"), stats.active],
          [t("admin.tripsPage.completedTrips"), stats.completed],
          [t("admin.tripsPage.cancelledTrips"), stats.cancelled],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                {trips === null ? "—" : value}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {error ? (
        <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />
      ) : trips === null ? (
        <LoadingState title={t("common.loading")} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <SearchBar
              label={t("common.search")}
              placeholder={t("common.searchPlaceholder")}
              value={table.search}
              onChange={(e) => table.setSearch(e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={table.pageItems.length === 0}
            >
              {t("admin.table.exportCsv")}
            </Button>
          </div>

          {table.totalCount === 0 ? (
            <EmptyState
              icon={<Illustration name="empty" size={80} />}
              title={t("admin.tripsPage.noTrips")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.tripsPage.id")}</TableHead>
                    <TableHead>{t("admin.tripsPage.passenger")}</TableHead>
                    <TableHead>{t("admin.tripsPage.driver")}</TableHead>
                    <TableHead>{t("admin.tripsPage.fare")}</TableHead>
                    <TableHead>{t("admin.tripsPage.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.pageItems.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium text-neutral-900 dark:text-neutral-50">
                        {trip.id}
                      </TableCell>
                      <TableCell>{trip.passengerId}</TableCell>
                      <TableCell>{trip.driverId ?? "—"}</TableCell>
                      <TableCell>
                        {trip.fareAmount !== undefined ? `$${trip.fareAmount.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge tone={STATUS_TONE[trip.status] ?? "neutral"}>
                          {t(`admin.tripStatus.${trip.status}`)}
                        </Badge>
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
                summary={t("admin.table.pageSummary", {
                  current: table.page,
                  total: table.pageCount,
                })}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
