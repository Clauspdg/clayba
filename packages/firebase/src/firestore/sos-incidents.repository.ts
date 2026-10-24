import {
  SOS_INCIDENTS_COLLECTION,
  SosIncidentStatus,
  sosIncidentSchema,
  type SosIncident,
} from "@the-ride/types";
import type { Firestore } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";

export class SosIncidentsRepository extends FirestoreRepository<SosIncident> {
  constructor(db: Firestore) {
    super(db, SOS_INCIDENTS_COLLECTION, createFirestoreConverter(sosIncidentSchema));
  }

  async acknowledge(id: string, acknowledgedBy: string): Promise<void> {
    await this.update(id, {
      status: SosIncidentStatus.ACKNOWLEDGED,
      acknowledgedBy,
      acknowledgedAt: new Date(),
    });
  }

  async resolve(id: string, resolvedBy: string, resolutionNote?: string): Promise<void> {
    await this.update(id, {
      status: SosIncidentStatus.RESOLVED,
      resolvedBy,
      resolvedAt: new Date(),
      ...(resolutionNote ? { resolutionNote } : {}),
    });
  }
}
