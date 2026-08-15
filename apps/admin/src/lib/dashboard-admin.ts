import {
  DriverAccountStatus,
  DriverApplicationStatus,
  DriverAvailabilityStatus,
  PaymentStatus,
  ReportCategory,
  ReportStatus,
  Role,
  SupportTicketPriority,
  SupportTicketStatus,
  TripStatus,
} from "@the-ride/types";
import { driverApplicationSchema, type DriverApplication } from "@the-ride/types";
import {
  collection,
  getCountFromServer,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  where,
  type Firestore,
} from "firebase/firestore";

export interface DashboardCounts {
  activeDrivers: number;
  passengers: number;
  trips: number;
  openTickets: number;
  newContactSubmissions: number;
}

/**
 * Dashboard home summary counts (Web Phase W1, Part 5) — Firestore
 * aggregation queries (`getCountFromServer`, a single server-side count,
 * not a full document read) rather than downloading every row just to
 * `.length` it. One-shot (aggregation queries have no `onSnapshot`
 * variant in the client SDK), refreshed on demand via `RefreshCounts`.
 */
export async function getDashboardCounts(db: Firestore): Promise<DashboardCounts> {
  const [activeDrivers, passengers, trips, openTickets, newContactSubmissions] = await Promise.all([
    getCountFromServer(
      query(collection(db, "drivers"), where("status", "==", DriverAccountStatus.ACTIVE)),
    ),
    getCountFromServer(query(collection(db, "users"), where("role", "==", Role.PASSENGER))),
    getCountFromServer(collection(db, "trips")),
    getCountFromServer(
      query(collection(db, "supportTickets"), where("status", "==", SupportTicketStatus.OPEN)),
    ),
    getCountFromServer(query(collection(db, "contactSubmissions"), where("status", "==", "new"))),
  ]);

  return {
    activeDrivers: activeDrivers.data().count,
    passengers: passengers.data().count,
    trips: trips.data().count,
    openTickets: openTickets.data().count,
    newContactSubmissions: newContactSubmissions.data().count,
  };
}

const ACTIVE_TRIP_STATUSES = [
  TripStatus.MATCHED,
  TripStatus.EN_ROUTE_TO_PICKUP,
  TripStatus.ARRIVED,
  TripStatus.IN_PROGRESS,
];

/** Mirrors `ApplicationsTab`'s own pending-review set — a driver application still awaiting a decision. */
const PENDING_APPLICATION_STATUSES = [
  DriverApplicationStatus.SUBMITTED,
  DriverApplicationStatus.DOCUMENTS_PENDING,
  DriverApplicationStatus.BACKGROUND_CHECK,
  DriverApplicationStatus.VEHICLE_INSPECTION,
  DriverApplicationStatus.INTERVIEW,
  DriverApplicationStatus.APPROVED,
];

const ONLINE_AVAILABILITY_STATUSES = [
  DriverAvailabilityStatus.ONLINE,
  DriverAvailabilityStatus.AVAILABLE,
  DriverAvailabilityStatus.BUSY,
  DriverAvailabilityStatus.ON_TRIP,
];

export interface OperationalSummary {
  activeRides: number;
  driversOnline: number;
  pendingApplications: number;
  /** Real, not fabricated: open URGENT/HIGH support tickets + open SAFETY-category reports. There is no dedicated "alerts" collection yet — this is the honest composite of what already exists. */
  criticalAlerts: number;
}

/**
 * UX Simplification sprint, Part 8 — the admin dashboard's top tier used
 * to be four generic entity counts (drivers/passengers/trips/tickets) plus
 * four bare link cards with no data at all. Replaced with what's actually
 * operationally urgent right now: rides in progress, drivers currently
 * online, applications waiting on a decision, and a critical-alerts count.
 * Every number here is a real Firestore aggregation query, same pattern
 * as `getDashboardCounts` below it — nothing here is invented.
 */
export async function getOperationalSummary(db: Firestore): Promise<OperationalSummary> {
  const [activeRides, driversOnline, pendingApplications, urgentTickets, safetyReports] =
    await Promise.all([
      getCountFromServer(
        query(collection(db, "trips"), where("status", "in", ACTIVE_TRIP_STATUSES)),
      ),
      getCountFromServer(
        query(
          collection(db, "drivers"),
          where("availabilityStatus", "in", ONLINE_AVAILABILITY_STATUSES),
        ),
      ),
      getCountFromServer(
        query(
          collection(db, "driverApplications"),
          where("status", "in", PENDING_APPLICATION_STATUSES),
        ),
      ),
      getCountFromServer(
        query(
          collection(db, "supportTickets"),
          where("status", "==", SupportTicketStatus.OPEN),
          where("priority", "in", [SupportTicketPriority.URGENT, SupportTicketPriority.HIGH]),
        ),
      ),
      getCountFromServer(
        query(
          collection(db, "reports"),
          where("status", "==", ReportStatus.OPEN),
          where("category", "==", ReportCategory.SAFETY),
        ),
      ),
    ]);

  return {
    activeRides: activeRides.data().count,
    driversOnline: driversOnline.data().count,
    pendingApplications: pendingApplications.data().count,
    criticalAlerts: urgentTickets.data().count + safetyReports.data().count,
  };
}

/**
 * UX Simplification sprint, Part 8 — the dashboard's second tier shows a
 * short real preview instead of nothing; reuses the same
 * `status ASC, submittedAt DESC` composite index `ApplicationsTab` already
 * relies on (an `in` filter combined with `orderBy` on a different field
 * is covered by the same index shape as the `==` case), so no new index
 * was needed for this specific query.
 */
export async function getRecentPendingApplications(
  db: Firestore,
  count = 5,
): Promise<DriverApplication[]> {
  const snapshot = await getDocs(
    query(
      collection(db, "driverApplications"),
      where("status", "in", PENDING_APPLICATION_STATUSES),
      orderBy("submittedAt", "desc"),
      fsLimit(count),
    ),
  );
  return snapshot.docs.map((d) => driverApplicationSchema.parse({ id: d.id, ...d.data() }));
}

export interface AnalyticsSummary {
  activeDrivers: number;
  passengers: number;
  totalTrips: number;
  openTickets: number;
  openReports: number;
  totalRevenue: number;
}

/**
 * Total captured revenue is summed client-side over `payments` docs
 * (no `sum()` aggregation used here) — consistent with this dashboard's
 * established "hundreds, not millions of rows" assumption for admin-scale
 * data (see `useTableState`'s doc comment).
 */
export async function getAnalyticsSummary(db: Firestore): Promise<AnalyticsSummary> {
  const [activeDrivers, passengers, totalTrips, openTickets, openReports, capturedPayments] =
    await Promise.all([
      getCountFromServer(
        query(collection(db, "drivers"), where("status", "==", DriverAccountStatus.ACTIVE)),
      ),
      getCountFromServer(query(collection(db, "users"), where("role", "==", Role.PASSENGER))),
      getCountFromServer(collection(db, "trips")),
      getCountFromServer(
        query(collection(db, "supportTickets"), where("status", "==", SupportTicketStatus.OPEN)),
      ),
      getCountFromServer(
        query(collection(db, "reports"), where("status", "==", ReportStatus.OPEN)),
      ),
      getDocs(query(collection(db, "payments"), where("status", "==", PaymentStatus.CAPTURED))),
    ]);

  const totalRevenue = capturedPayments.docs.reduce(
    (sum, doc) => sum + (doc.data().amount as number),
    0,
  );

  return {
    activeDrivers: activeDrivers.data().count,
    passengers: passengers.data().count,
    totalTrips: totalTrips.data().count,
    openTickets: openTickets.data().count,
    openReports: openReports.data().count,
    totalRevenue,
  };
}
