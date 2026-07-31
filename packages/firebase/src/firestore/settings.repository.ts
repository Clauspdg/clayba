import {
  DEFAULT_VEHICLE_CATEGORIES,
  GLOBAL_SETTINGS_DOC_ID,
  SETTINGS_COLLECTION,
  VEHICLE_CATEGORIES_COLLECTION,
  platformSettingsSchema,
  vehicleCategorySchema,
  type CreateVehicleCategoryInput,
  type PlatformSettings,
  type Role,
  type VehicleCategory,
} from "@the-ride/types";
import type { Firestore, UpdateData } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";
import type { AuditLogsRepository } from "./authentication.repository";

export class SettingsRepository extends FirestoreRepository<PlatformSettings> {
  constructor(
    db: Firestore,
    private readonly auditLogs: AuditLogsRepository,
  ) {
    super(db, SETTINGS_COLLECTION, createFirestoreConverter(platformSettingsSchema));
  }

  async getGlobal(): Promise<PlatformSettings | null> {
    return this.findById(GLOBAL_SETTINGS_DOC_ID);
  }

  async updateGlobal(changes: Partial<Omit<PlatformSettings, "id">>, actorId: string, actorRole: Role): Promise<void> {
    await this.update(GLOBAL_SETTINGS_DOC_ID, {
      ...changes,
      updatedBy: actorId,
      updatedAt: new Date(),
    } as UpdateData<PlatformSettings>);

    await this.auditLogs.record({
      action: "settings.updated",
      actorId,
      actorRole,
      targetId: GLOBAL_SETTINGS_DOC_ID,
      targetType: "settings",
      metadata: { changedKeys: Object.keys(changes) },
    });
  }
}

/**
 * Admin-configurable ride tiers (Sprint 3, Part 3). Everything a category
 * needs for the pricing engine (`@the-ride/utils`'s `calculateFare`) lives
 * on the record itself — see docs/vehicle-categories.md.
 */
export class VehicleCategoriesRepository extends FirestoreRepository<VehicleCategory> {
  constructor(
    db: Firestore,
    private readonly auditLogs: AuditLogsRepository,
  ) {
    super(db, VEHICLE_CATEGORIES_COLLECTION, createFirestoreConverter(vehicleCategorySchema));
  }

  async listActive(): Promise<VehicleCategory[]> {
    const categories = await this.findWhere("isActive", "==", true);
    return categories.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async createCategory(input: CreateVehicleCategoryInput, actorId: string, actorRole: Role): Promise<VehicleCategory> {
    const id = this.newId();
    const now = new Date();
    const category = vehicleCategorySchema.parse({ ...input, id, createdAt: now, updatedAt: now });
    await this.create(id, category);

    await this.auditLogs.record({
      action: "settings.updated",
      actorId,
      actorRole,
      targetId: id,
      targetType: "vehicleCategory",
    });

    return category;
  }

  async updateCategory(id: string, changes: Partial<Omit<VehicleCategory, "id">>, actorId: string, actorRole: Role): Promise<void> {
    await this.update(id, { ...changes, updatedAt: new Date() } as UpdateData<VehicleCategory>);

    await this.auditLogs.record({
      action: "settings.updated",
      actorId,
      actorRole,
      targetId: id,
      targetType: "vehicleCategory",
      metadata: { changedKeys: Object.keys(changes) },
    });
  }

  /** Seeds the six starter categories (`DEFAULT_VEHICLE_CATEGORIES`) into a fresh environment. No-op for categories that already exist. */
  async seedDefaults(): Promise<void> {
    const now = new Date();
    for (const seed of DEFAULT_VEHICLE_CATEGORIES) {
      const existing = await this.findById(seed.id);
      if (existing) continue;
      const category = vehicleCategorySchema.parse({ ...seed, isActive: true, createdAt: now, updatedAt: now });
      await this.create(seed.id, category);
    }
  }
}
