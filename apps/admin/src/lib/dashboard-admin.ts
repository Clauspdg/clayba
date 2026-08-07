import {
  DriverAccountStatus,
  PaymentStatus,
  ReportStatus,
  Role,
  SupportTicketStatus,
} from "@the-ride/types";
import {
  collection,
  getCountFromServer,
  getDocs,
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
