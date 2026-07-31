import { NOTIFICATIONS_COLLECTION, notificationSchema, type Notification } from "@the-ride/types";
import type { Firestore, UpdateData } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";

export class NotificationsRepository extends FirestoreRepository<Notification> {
  constructor(db: Firestore) {
    super(db, NOTIFICATIONS_COLLECTION, createFirestoreConverter(notificationSchema));
  }

  async listForUser(userId: string): Promise<Notification[]> {
    return this.findWhere("userId", "==", userId);
  }

  async markRead(notificationId: string): Promise<void> {
    await this.update(notificationId, { isRead: true } as UpdateData<Notification>);
  }
}
