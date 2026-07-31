import { EMERGENCY_CONTACTS_COLLECTION, emergencyContactSchema, type EmergencyContact } from "@the-ride/types";
import type { Firestore } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";

export class EmergencyContactsRepository extends FirestoreRepository<EmergencyContact> {
  constructor(db: Firestore) {
    super(db, EMERGENCY_CONTACTS_COLLECTION, createFirestoreConverter(emergencyContactSchema));
  }

  async listForUser(userId: string): Promise<EmergencyContact[]> {
    return this.findWhere("userId", "==", userId);
  }
}
