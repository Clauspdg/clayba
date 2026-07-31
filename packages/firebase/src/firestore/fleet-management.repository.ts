import { VEHICLES_COLLECTION, vehicleSchema, type Vehicle } from "@the-ride/types";
import type { Firestore } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";

export class VehiclesRepository extends FirestoreRepository<Vehicle> {
  constructor(db: Firestore) {
    super(db, VEHICLES_COLLECTION, createFirestoreConverter(vehicleSchema));
  }

  async listForDriver(driverId: string): Promise<Vehicle[]> {
    return this.findWhere("driverId", "==", driverId);
  }
}
