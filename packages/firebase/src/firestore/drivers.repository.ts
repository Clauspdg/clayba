import {
  DEFAULT_DRIVER_SCORE,
  DRIVER_APPLICATIONS_COLLECTION,
  DRIVER_PRESENCE_COLLECTION,
  DRIVER_SUSPENSIONS_COLLECTION,
  DRIVER_WARNINGS_COLLECTION,
  DRIVERS_COLLECTION,
  DriverAccountStatus,
  DriverApplicationStatus,
  DriverAvailabilityStatus,
  driverApplicationSchema,
  driverPresenceSchema,
  driverSchema,
  driverSuspensionSchema,
  driverWarningSchema,
  type Driver,
  type DriverApplication,
  type DriverPresence,
  type DriverStatistics,
  type DriverSuspension,
  type DriverWarning,
  type Role,
} from "@the-ride/types";
import {
  assertAvailabilityTransition,
  assertDriverApplicationTransition,
  calculateDriverScore,
} from "@the-ride/utils";
import { FieldValue, type Firestore, type UpdateData } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";
import type { AuditLogsRepository } from "./authentication.repository";

export class DriverApplicationsRepository extends FirestoreRepository<DriverApplication> {
  constructor(db: Firestore) {
    super(db, DRIVER_APPLICATIONS_COLLECTION, createFirestoreConverter(driverApplicationSchema));
  }

  /** Validates the transition via `@the-ride/utils`'s workflow state machine before writing. */
  async transition(
    applicationId: string,
    to: DriverApplicationStatus,
    extra: Partial<Pick<DriverApplication, "reviewedBy" | "rejectionReason">> = {},
  ): Promise<DriverApplication> {
    const application = await this.findById(applicationId);
    if (!application) {
      throw new Error(`Driver application "${applicationId}" not found.`);
    }

    assertDriverApplicationTransition(application.status, to);

    const updatedAt = new Date();
    await this.update(applicationId, {
      ...extra,
      status: to,
      updatedAt,
    } as UpdateData<DriverApplication>);

    return { ...application, ...extra, status: to, updatedAt };
  }

  /** For an admin review queue — oldest submissions first. Requires a composite index. */
  async listByStatus(status: DriverApplicationStatus): Promise<DriverApplication[]> {
    return this.findWhereOrdered("status", "==", status, "createdAt", "asc");
  }
}

export class DriverWarningsRepository extends FirestoreRepository<DriverWarning> {
  constructor(db: Firestore) {
    super(db, DRIVER_WARNINGS_COLLECTION, createFirestoreConverter(driverWarningSchema));
  }

  async issue(params: {
    driverId: string;
    reason: string;
    issuedBy: string;
  }): Promise<DriverWarning> {
    const id = this.newId();
    const warning = driverWarningSchema.parse({ ...params, id, createdAt: new Date() });
    return this.create(id, warning);
  }

  async listForDriver(driverId: string): Promise<DriverWarning[]> {
    return this.findWhereOrdered("driverId", "==", driverId, "createdAt", "desc");
  }
}

export class DriverSuspensionsRepository extends FirestoreRepository<DriverSuspension> {
  constructor(db: Firestore) {
    super(db, DRIVER_SUSPENSIONS_COLLECTION, createFirestoreConverter(driverSuspensionSchema));
  }

  async open(params: {
    driverId: string;
    reason: string;
    suspendedBy: string;
    endAt?: Date;
  }): Promise<DriverSuspension> {
    const id = this.newId();
    const suspension = driverSuspensionSchema.parse({
      ...params,
      id,
      startAt: new Date(),
      createdAt: new Date(),
    });
    return this.create(id, suspension);
  }

  async lift(suspensionId: string, liftedBy: string): Promise<void> {
    await this.update(suspensionId, {
      liftedAt: new Date(),
      liftedBy,
    } as UpdateData<DriverSuspension>);
  }

  async findActiveForDriver(driverId: string): Promise<DriverSuspension[]> {
    const suspensions = await this.findWhere("driverId", "==", driverId);
    return suspensions.filter((suspension) => !suspension.liftedAt);
  }
}

/**
 * Driver presence — heartbeat, last-seen, online duration, current
 * status/ride, and multi-device tracking (Sprint 4, Part 2). Document id
 * === driverId. Kept as its own collection rather than fields on `Driver`
 * because presence changes on every heartbeat — see the schema comment
 * on `driverPresenceSchema` and docs/driver-presence.md.
 */
export class DriverPresenceRepository extends FirestoreRepository<DriverPresence> {
  constructor(db: Firestore) {
    super(db, DRIVER_PRESENCE_COLLECTION, createFirestoreConverter(driverPresenceSchema));
  }

  /** Upserts one device's heartbeat without disturbing other devices the same driver is signed in on ("support multiple devices safely"). */
  async heartbeat(
    driverId: string,
    deviceId: string,
    platform: "ios" | "android" | "web",
  ): Promise<DriverPresence> {
    const now = new Date();
    const existing = await this.findById(driverId);

    if (!existing) {
      const presence = driverPresenceSchema.parse({
        id: driverId,
        driverId,
        status: DriverAvailabilityStatus.OFFLINE,
        lastHeartbeatAt: now,
        lastSeenAt: now,
        devices: { [deviceId]: { platform, lastActiveAt: now } },
        updatedAt: now,
      });
      return this.create(driverId, presence);
    }

    await this.update(driverId, {
      lastHeartbeatAt: now,
      lastSeenAt: now,
      [`devices.${deviceId}`]: { platform, lastActiveAt: now },
      updatedAt: now,
    } as UpdateData<DriverPresence>);

    return this.requirePresence(driverId);
  }

  /** Sets `status`/`availabilityReason`/`currentRideId` and maintains `onlineSince` for duration tracking. Does not validate the transition — callers use `DriversRepository.setAvailabilityStatus()` for that. */
  async setStatus(
    driverId: string,
    status: DriverAvailabilityStatus,
    params: { reason?: string; currentRideId?: string } = {},
  ): Promise<DriverPresence> {
    const now = new Date();
    const existing = await this.findById(driverId);

    if (!existing) {
      // Optional fields are omitted entirely rather than set to `undefined`
      // — the Admin SDK rejects a literal `undefined` field value on
      // create/set outright, which crashed every first-ever presence write
      // for a driver (the common case: no `driverPresence` doc exists
      // until their first real availability change goes through here).
      const presence = driverPresenceSchema.parse({
        id: driverId,
        driverId,
        status,
        ...(params.reason !== undefined ? { availabilityReason: params.reason } : {}),
        ...(params.currentRideId !== undefined ? { currentRideId: params.currentRideId } : {}),
        lastHeartbeatAt: now,
        lastSeenAt: now,
        ...(status === DriverAvailabilityStatus.OFFLINE ? {} : { onlineSince: now }),
        devices: {},
        updatedAt: now,
      });
      return this.create(driverId, presence);
    }

    const updateData: Record<string, unknown> = { status, updatedAt: now };
    updateData.availabilityReason =
      params.reason === undefined ? FieldValue.delete() : params.reason;

    if (params.currentRideId !== undefined) {
      updateData.currentRideId = params.currentRideId;
    } else if (
      status !== DriverAvailabilityStatus.BUSY &&
      status !== DriverAvailabilityStatus.ON_TRIP
    ) {
      updateData.currentRideId = FieldValue.delete();
    }

    if (status === DriverAvailabilityStatus.OFFLINE) {
      updateData.onlineSince = FieldValue.delete();
    } else if (!existing.onlineSince) {
      updateData.onlineSince = now;
    }

    await this.update(driverId, updateData as UpdateData<DriverPresence>);
    return this.requirePresence(driverId);
  }

  private async requirePresence(driverId: string): Promise<DriverPresence> {
    const presence = await this.findById(driverId);
    if (!presence) {
      throw new Error(`Driver presence "${driverId}" not found.`);
    }
    return presence;
  }
}

export interface DriverActionParams {
  driverId: string;
  actorId: string;
  actorRole: Role;
}

/**
 * Driver account management (Sprint 1, Part 5). This repository is the
 * single place allowed to mutate driver status — every method validates
 * the transition, writes the change, and records an audit log entry, so
 * there is never a status change without a paper trail (see
 * `docs/driver-management.md` and `docs/security.md`).
 */
export class DriversRepository extends FirestoreRepository<Driver> {
  constructor(
    db: Firestore,
    private readonly applications: DriverApplicationsRepository,
    private readonly warnings: DriverWarningsRepository,
    private readonly suspensions: DriverSuspensionsRepository,
    private readonly auditLogs: AuditLogsRepository,
    private readonly presence: DriverPresenceRepository,
  ) {
    super(db, DRIVERS_COLLECTION, createFirestoreConverter(driverSchema));
  }

  /**
   * The single entry point for changing a driver's real-time availability
   * (Sprint 4, Part 1) — validates the transition, updates the `drivers`
   * document (including the deprecated `isOnline`/`isAvailable` booleans,
   * kept in sync for any Sprint 3 code still reading them), and mirrors
   * the new status onto `DriverPresenceRepository` in one call.
   */
  async setAvailabilityStatus(params: {
    driverId: string;
    status: DriverAvailabilityStatus;
    reason?: string;
    currentRideId?: string;
  }): Promise<Driver> {
    const driver = await this.requireDriver(params.driverId);
    assertAvailabilityTransition(driver.availabilityStatus, params.status);

    const isOnline =
      params.status !== DriverAvailabilityStatus.OFFLINE &&
      params.status !== DriverAvailabilityStatus.INACTIVE;
    const isAvailable = params.status === DriverAvailabilityStatus.AVAILABLE;

    await this.update(params.driverId, {
      availabilityStatus: params.status,
      // Firestore's Admin SDK rejects `undefined` field values outright — FieldValue.delete() is the correct way to clear a field.
      availabilityReason: params.reason === undefined ? FieldValue.delete() : params.reason,
      isOnline,
      isAvailable,
      updatedAt: new Date(),
    } as UpdateData<Driver>);

    await this.presence.setStatus(params.driverId, params.status, {
      reason: params.reason,
      currentRideId: params.currentRideId,
    });

    return {
      ...driver,
      availabilityStatus: params.status,
      availabilityReason: params.reason,
      isOnline,
      isAvailable,
    };
  }

  async approveApplication(
    params: DriverActionParams & { applicationId: string },
  ): Promise<DriverApplication> {
    const application = await this.applications.transition(
      params.applicationId,
      DriverApplicationStatus.APPROVED,
      {
        reviewedBy: params.actorId,
      },
    );
    await this.auditLogs.record({
      action: "driver.approved",
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetId: params.applicationId,
      targetType: "driverApplication",
    });
    return application;
  }

  async rejectApplication(
    params: DriverActionParams & { applicationId: string; reason: string },
  ): Promise<DriverApplication> {
    const application = await this.applications.transition(
      params.applicationId,
      DriverApplicationStatus.REJECTED,
      {
        reviewedBy: params.actorId,
        rejectionReason: params.reason,
      },
    );
    await this.auditLogs.record({
      action: "driver.rejected",
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetId: params.applicationId,
      targetType: "driverApplication",
      reason: params.reason,
    });
    return application;
  }

  /** Approved application -> Activated + creates the `drivers` account record. */
  async activateApplication(
    params: DriverActionParams & { applicationId: string; userId: string },
  ): Promise<Driver> {
    await this.applications.transition(params.applicationId, DriverApplicationStatus.ACTIVATED);

    const id = this.newId();
    const now = new Date();
    const driver = driverSchema.parse({
      id,
      userId: params.userId,
      applicationId: params.applicationId,
      status: DriverAccountStatus.ACTIVE,
      documents: [],
      rating: 0,
      completedTrips: 0,
      warningsCount: 0,
      score: DEFAULT_DRIVER_SCORE,
      createdAt: now,
      updatedAt: now,
    });
    await this.create(id, driver);

    await this.auditLogs.record({
      action: "driver.activated",
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetId: id,
      targetType: "driver",
    });

    return driver;
  }

  async suspend(params: DriverActionParams & { reason: string; endAt?: Date }): Promise<Driver> {
    const driver = await this.requireDriver(params.driverId);
    if (driver.status !== DriverAccountStatus.ACTIVE) {
      throw new Error(
        `Driver "${params.driverId}" must be active to be suspended (current: ${driver.status}).`,
      );
    }

    await this.suspensions.open({
      driverId: params.driverId,
      reason: params.reason,
      suspendedBy: params.actorId,
      endAt: params.endAt,
    });
    await this.update(params.driverId, {
      status: DriverAccountStatus.SUSPENDED,
      updatedAt: new Date(),
    } as UpdateData<Driver>);

    await this.auditLogs.record({
      action: "driver.suspended",
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetId: params.driverId,
      targetType: "driver",
      reason: params.reason,
    });

    return { ...driver, status: DriverAccountStatus.SUSPENDED };
  }

  async reactivate(params: DriverActionParams): Promise<Driver> {
    const driver = await this.requireDriver(params.driverId);
    if (driver.status !== DriverAccountStatus.SUSPENDED) {
      throw new Error(
        `Driver "${params.driverId}" must be suspended to be reactivated (current: ${driver.status}).`,
      );
    }

    const activeSuspensions = await this.suspensions.findActiveForDriver(params.driverId);
    await Promise.all(
      activeSuspensions.map((suspension) => this.suspensions.lift(suspension.id, params.actorId)),
    );

    await this.update(params.driverId, {
      status: DriverAccountStatus.ACTIVE,
      updatedAt: new Date(),
    } as UpdateData<Driver>);

    await this.auditLogs.record({
      action: "driver.reactivated",
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetId: params.driverId,
      targetType: "driver",
    });

    return { ...driver, status: DriverAccountStatus.ACTIVE };
  }

  async warn(params: DriverActionParams & { reason: string }): Promise<DriverWarning> {
    const driver = await this.requireDriver(params.driverId);
    const warning = await this.warnings.issue({
      driverId: params.driverId,
      reason: params.reason,
      issuedBy: params.actorId,
    });

    const warningsCount = driver.warningsCount + 1;
    const score = calculateDriverScore({
      rating: driver.rating,
      completedTrips: driver.completedTrips,
      cancelledTrips: 0,
      warningsCount,
    });
    await this.update(params.driverId, {
      warningsCount,
      score,
      updatedAt: new Date(),
    } as UpdateData<Driver>);

    await this.auditLogs.record({
      action: "driver.warned",
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetId: params.driverId,
      targetType: "driver",
      reason: params.reason,
    });

    return warning;
  }

  async terminate(params: DriverActionParams & { reason: string }): Promise<Driver> {
    const driver = await this.requireDriver(params.driverId);
    if (driver.status === DriverAccountStatus.TERMINATED) {
      throw new Error(`Driver "${params.driverId}" is already terminated.`);
    }

    await this.update(params.driverId, {
      status: DriverAccountStatus.TERMINATED,
      updatedAt: new Date(),
    } as UpdateData<Driver>);

    await this.auditLogs.record({
      action: "driver.terminated",
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetId: params.driverId,
      targetType: "driver",
      reason: params.reason,
    });

    return { ...driver, status: DriverAccountStatus.TERMINATED };
  }

  async getStatus(driverId: string): Promise<DriverAccountStatus> {
    return (await this.requireDriver(driverId)).status;
  }

  /**
   * Best-effort statistics derived from the driver's own denormalized
   * counters. `cancelledTrips`/`totalEarnings` require the `trips` and
   * `payments` domains' business logic (out of scope this sprint) — they
   * default to 0 until that aggregation exists.
   */
  async getStatistics(driverId: string): Promise<DriverStatistics> {
    const driver = await this.requireDriver(driverId);
    return {
      driverId,
      totalTrips: driver.completedTrips,
      completedTrips: driver.completedTrips,
      cancelledTrips: 0,
      averageRating: driver.rating,
      totalEarnings: 0,
      warningsCount: driver.warningsCount,
      score: driver.score,
    };
  }

  private async requireDriver(driverId: string): Promise<Driver> {
    const driver = await this.findById(driverId);
    if (!driver) {
      throw new Error(`Driver "${driverId}" not found.`);
    }
    return driver;
  }
}

export function createDriverRepositories(db: Firestore, auditLogs: AuditLogsRepository) {
  const applications = new DriverApplicationsRepository(db);
  const warnings = new DriverWarningsRepository(db);
  const suspensions = new DriverSuspensionsRepository(db);
  const presence = new DriverPresenceRepository(db);
  const drivers = new DriversRepository(
    db,
    applications,
    warnings,
    suspensions,
    auditLogs,
    presence,
  );

  return { applications, warnings, suspensions, presence, drivers };
}
