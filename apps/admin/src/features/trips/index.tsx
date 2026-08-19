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
import { TripRequestStatus, TripStatus, type Trip, type TripRequest } from "@the-ride/types";
import { collection, limit as fsLimit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

type RideItem = ({ source: "request" } & TripRequest) | ({ source: "trip" } & Trip);

const TRIP_STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  requested: "neutral",
  matched: "brand",
  en_route_to_pickup: "brand",
  arrived: "brand",
  in_progress: "brand",
  completed: "success",
  cancelled: "danger",
};

const REQUEST_STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> =
  {
    draft: "neutral",
    estimating: "neutral",
    pending: "neutral",
    confirmed: "brand",
    searching_driver: "warning",
    matched: "brand",
    driver_assigned: "brand",
    driver_accepted: "success",
    driver_rejected: "danger",
    cancelled: "danger",
    expired: "danger",
  };

/**
 * A `tripRequest` this far along already has a real `trips/{id}` doc created
 * from it (`DispatchService.handleOfferAccepted`) — showing both would list
 * the same ride twice. Mirrors `apps/web`'s passenger Ride History page,
 * which already solves this exact problem the same way.
 */
function isSupersededByTrip(status: TripRequestStatus): boolean {
  return status === TripRequestStatus.DRIVER_ACCEPTED;
}

function isActiveRequestStatus(status: TripRequestStatus): boolean {
  return ![
    TripRequestStatus.CANCELLED,
    TripRequestStatus.EXPIRED,
    TripRequestStatus.DRIVER_REJECTED,
  ].includes(status);
}

function isActiveTripStatus(status: TripStatus): boolean {
  return ![TripStatus.COMPLETED, TripStatus.CANCELLED].includes(status);
}

/**
 * Trips (Web Phase W1, Parts 5-6; widened by a CRITICAL DATA CONSISTENCY
 * fix) — a ride only gets a `trips` document once a driver has actually
 * accepted it (`DispatchService.handleOfferAccepted`); before that, it
 * lives in `tripRequests` (searching, assigned, or already accepted). This
 * page previously read `trips` alone, with a doc comment explaining that
 * `tripRequests` was admin-unreadable — true when that comment was written,
 * but `firestore.rules`'s `tripRequests` read rule now also grants
 * `admin`/`super_admin`/`dispatcher` (see the `hasRole([...])` clause), and
 * this page was never updated to use it. The result: every ride still
 * searching for (or waiting on) a driver was completely invisible here,
 * not deleted — a real, live ride "publiée" by a passenger would only
 * appear once matched, making it look like requests had vanished. Merges
 * both collections the same way `apps/web`'s passenger Ride History page
 * already does, rather than inventing a new model.
 */
export function TripsPage() {
  const { t } = useTranslation();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [requests, setRequests] = useState<TripRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubTrips = onSnapshot(
      query(collection(adminFirestore, "trips"), orderBy("createdAt", "desc"), fsLimit(500)),
      (snapshot) => setTrips(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Trip)),
      (err) => setError(err.message),
    );
    const unsubRequests = onSnapshot(
      query(collection(adminFirestore, "tripRequests"), orderBy("createdAt", "desc"), fsLimit(500)),
      (snapshot) =>
        setRequests(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TripRequest)),
      (err) => setError(err.message),
    );
    return () => {
      unsubTrips();
      unsubRequests();
    };
  }, []);

  const rideItems = useMemo<RideItem[]>(
    () => [
      ...(requests ?? [])
        .filter((r) => !isSupersededByTrip(r.status))
        .map((r) => ({ source: "request" as const, ...r })),
      ...(trips ?? []).map((tr) => ({ source: "trip" as const, ...tr })),
    ],
    [requests, trips],
  );

  const table = useTableState({
    data: rideItems,
    searchFields: ["id", "passengerId"],
    pageSize: 10,
  });

  const stats = useMemo(() => {
    return {
      total: rideItems.length,
      active: rideItems.filter((item) =>
        item.source === "request"
          ? isActiveRequestStatus(item.status)
          : isActiveTripStatus(item.status),
      ).length,
      completed: rideItems.filter(
        (item) => item.source === "trip" && item.status === TripStatus.COMPLETED,
      ).length,
      cancelled: rideItems.filter((item) =>
        item.source === "request"
          ? !isActiveRequestStatus(item.status)
          : item.status === TripStatus.CANCELLED,
      ).length,
    };
  }, [rideItems]);

  function handleExport() {
    exportToCsv(
      "trips",
      table.pageItems.map((item) => ({
        id: item.id,
        passengerId: item.passengerId,
        driverId: (item.source === "request" ? item.assignedDriverId : item.driverId) ?? "",
        status: item.status,
        fare: (item.source === "request" ? item.fareEstimate?.total : item.fareAmount) ?? "",
      })),
    );
  }

  const loading = trips === null || requests === null;

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
                {loading ? "—" : value}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {error ? (
        <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />
      ) : loading ? (
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
                  {table.pageItems.map((item) => {
                    const driverId =
                      item.source === "request" ? item.assignedDriverId : item.driverId;
                    const fare =
                      item.source === "request" ? item.fareEstimate?.total : item.fareAmount;
                    const tone =
                      (item.source === "request"
                        ? REQUEST_STATUS_TONE[item.status]
                        : TRIP_STATUS_TONE[item.status]) ?? "neutral";
                    const statusLabel =
                      item.source === "request"
                        ? t(`admin.rideRequestStatus.${item.status}`)
                        : t(`admin.tripStatus.${item.status}`);
                    return (
                      <TableRow key={`${item.source}-${item.id}`}>
                        <TableCell className="font-medium text-neutral-900 dark:text-neutral-50">
                          {item.id}
                        </TableCell>
                        <TableCell>{item.passengerId}</TableCell>
                        <TableCell>{driverId ?? "—"}</TableCell>
                        <TableCell>{fare !== undefined ? `$${fare.toFixed(2)}` : "—"}</TableCell>
                        <TableCell>
                          <Badge tone={tone}>{statusLabel}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
