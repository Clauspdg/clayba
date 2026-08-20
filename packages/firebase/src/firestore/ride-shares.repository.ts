import {
  RIDE_SHARES_COLLECTION,
  rideShareSchema,
  type CreateRideShareInput,
  type RideShare,
  type RideSharePublicView,
} from "@the-ride/types";
import type { Firestore, UpdateData } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";

/**
 * CLAYBA P1, Part C — "Share My Ride." Document id is the SHA-256 hex of
 * the random share token (never the raw token, never the ride id) — see
 * `rideShareSchema`'s doc comment. Only the passenger who created a share
 * may revoke it; the public tracking page never touches this repository
 * directly, it only ever reads the `publicView` field through
 * `firestore.rules`'s unauthenticated `get` rule.
 */
export class RideSharesRepository extends FirestoreRepository<RideShare> {
  constructor(db: Firestore) {
    super(db, RIDE_SHARES_COLLECTION, createFirestoreConverter(rideShareSchema));
  }

  async createShare(tokenHash: string, input: CreateRideShareInput): Promise<RideShare> {
    const share = rideShareSchema.parse({
      ...input,
      id: tokenHash,
      status: "active",
      createdAt: new Date(),
    });
    return this.create(tokenHash, share);
  }

  /** Every still-active share pointing at this ride — used by the trip-update trigger to keep each one's `publicView` in sync, and to trim `expiresAt` once the ride ends. */
  async listActiveForRide(rideId: string): Promise<RideShare[]> {
    const snapshot = await this.collection
      .where("rideId", "==", rideId)
      .where("status", "==", "active")
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }

  async syncPublicView(tokenHash: string, publicView: RideSharePublicView): Promise<void> {
    await this.update(tokenHash, { publicView } as UpdateData<RideShare>);
  }

  /** Trims a share's expiry once its ride ends (`completed`/`cancelled`) — see `RIDE_SHARE_EXPIRY_AFTER_COMPLETION_SECONDS`. Never extends an expiry, only shortens it. */
  async trimExpiryAfterRideEnded(tokenHash: string, expiresAt: Date): Promise<void> {
    await this.update(tokenHash, { expiresAt } as UpdateData<RideShare>);
  }

  async revoke(tokenHash: string, requesterId: string): Promise<void> {
    const share = await this.findById(tokenHash);
    if (!share) throw new Error(`Ride share "${tokenHash}" not found.`);
    if (share.createdBy !== requesterId) {
      throw new Error("Not authorized to revoke this share.");
    }
    await this.update(tokenHash, {
      status: "revoked",
      revokedAt: new Date(),
    } as UpdateData<RideShare>);
  }
}
