import type { Firestore } from "firebase-admin/firestore";

import { AuditLogsRepository, UsersRepository } from "./authentication.repository";
import { createDriverRepositories } from "./drivers.repository";
import { EmergencyContactsRepository } from "./emergency.repository";
import { VehiclesRepository } from "./fleet-management.repository";
import { NotificationsRepository } from "./notifications.repository";
import { PassengersRepository } from "./passengers.repository";
import { PaymentsRepository } from "./payments.repository";
import { ReportsRepository } from "./reports.repository";
import { SettingsRepository, VehicleCategoriesRepository } from "./settings.repository";
import { SupportTicketsRepository } from "./support.repository";
import {
  DispatchEventsRepository,
  DispatchQueueRepository,
  MatchingLogsRepository,
  RatingsRepository,
  ReviewsRepository,
  RideOffersRepository,
  TripRequestsRepository,
  TripsRepository,
} from "./trips.repository";
import {
  CommissionsRepository,
  TransactionsRepository,
  WalletsRepository,
} from "./wallet.repository";
import { DispatchService } from "./dispatch.service";

export * from "./converter";
export * from "./base.repository";
export * from "./authentication.repository";
export * from "./drivers.repository";
export * from "./fleet-management.repository";
export * from "./passengers.repository";
export * from "./trips.repository";
export * from "./payments.repository";
export * from "./wallet.repository";
export * from "./reports.repository";
export * from "./support.repository";
export * from "./settings.repository";
export * from "./emergency.repository";
export * from "./notifications.repository";
export * from "./dispatch.service";

/**
 * Wires up every repository against a single `Firestore` instance. Prefer
 * this over constructing repositories ad hoc so cross-repository
 * dependencies (e.g. driver management writing audit logs) are always
 * connected consistently.
 */
export function createRepositories(db: Firestore) {
  const auditLogs = new AuditLogsRepository(db);
  const users = new UsersRepository(db);
  const { applications, warnings, suspensions, presence, drivers } = createDriverRepositories(
    db,
    auditLogs,
  );
  const vehicles = new VehiclesRepository(db);
  const passengers = new PassengersRepository(db);
  const trips = new TripsRepository(db);
  const tripRequests = new TripRequestsRepository(db);
  const ratings = new RatingsRepository(db);
  const reviews = new ReviewsRepository(db);
  const payments = new PaymentsRepository(db, auditLogs);
  const transactions = new TransactionsRepository(db);
  const commissions = new CommissionsRepository(db);
  const wallets = new WalletsRepository(db, transactions, auditLogs);
  const reports = new ReportsRepository(db, auditLogs);
  const supportTickets = new SupportTicketsRepository(db, auditLogs);
  const settings = new SettingsRepository(db, auditLogs);
  const vehicleCategories = new VehicleCategoriesRepository(db, auditLogs);
  const emergencyContacts = new EmergencyContactsRepository(db);
  const notifications = new NotificationsRepository(db);
  const offers = new RideOffersRepository(db);
  const dispatchQueue = new DispatchQueueRepository(db);
  const dispatchEvents = new DispatchEventsRepository(db);
  const matchingLogs = new MatchingLogsRepository(db);
  const dispatch = new DispatchService({
    drivers,
    vehicles,
    tripRequests,
    trips,
    settings,
    presence,
    offers,
    dispatchQueue,
    dispatchEvents,
    matchingLogs,
  });

  return {
    auditLogs,
    users,
    driverApplications: applications,
    driverWarnings: warnings,
    driverSuspensions: suspensions,
    driverPresence: presence,
    drivers,
    vehicles,
    passengers,
    trips,
    tripRequests,
    ratings,
    reviews,
    payments,
    transactions,
    commissions,
    wallets,
    reports,
    supportTickets,
    settings,
    vehicleCategories,
    emergencyContacts,
    notifications,
    rideOffers: offers,
    dispatchQueue,
    dispatchEvents,
    matchingLogs,
    dispatch,
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
