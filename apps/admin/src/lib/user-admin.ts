import { Role, UserStatus } from "@the-ride/types";
import { doc, serverTimestamp, updateDoc, type Firestore } from "firebase/firestore";

/**
 * Admin-dashboard user account actions (Web Phase W1, Part 6) — direct
 * client Firestore writes to the `users` collection, authorized by
 * `firestore.rules`'s `isAdmin()` check on that collection's `update` rule.
 * Same known gap as `driver-admin.ts`: no `auditLogs` entry is written
 * (that collection is `allow write: if false` for every client).
 */

export async function suspendUser(db: Firestore, userId: string): Promise<void> {
  await updateDoc(doc(db, "users", userId), {
    status: UserStatus.SUSPENDED,
    updatedAt: serverTimestamp(),
  });
}

export async function reactivateUser(db: Firestore, userId: string): Promise<void> {
  await updateDoc(doc(db, "users", userId), {
    status: UserStatus.ACTIVE,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Updates the `users/{userId}` document's `role` field only. IMPORTANT
 * GAP: this does NOT update the Firebase Auth custom claim RBAC actually
 * enforces (`AuthClaims.role`, set server-side by `assignUserRole()` in
 * `@the-ride/firebase`, Admin SDK only). Until a Cloud Function trigger
 * syncs `users/{uid}.role` writes to custom claims, a role changed here
 * will NOT change what that user can actually do — surfaced to the admin
 * as a visible warning in `UsersPage` rather than silently no-op'd.
 */
export async function updateUserRole(db: Firestore, userId: string, role: Role): Promise<void> {
  await updateDoc(doc(db, "users", userId), {
    role,
    updatedAt: serverTimestamp(),
  });
}
