import { ReportStatus } from "@the-ride/types";
import { doc, serverTimestamp, updateDoc, type Firestore } from "firebase/firestore";

/**
 * Admin-dashboard incident report moderation (Web Phase W1, Parts 5-6) —
 * direct client Firestore writes, authorized by `firestore.rules`'s
 * `hasRole(['admin','super_admin','moderator'])` check on `reports`'s
 * update rule.
 */

export async function resolveReport(
  db: Firestore,
  reportId: string,
  resolvedBy: string,
): Promise<void> {
  await updateDoc(doc(db, "reports", reportId), {
    status: ReportStatus.RESOLVED,
    resolvedBy,
    updatedAt: serverTimestamp(),
  });
}

export async function dismissReport(
  db: Firestore,
  reportId: string,
  resolvedBy: string,
): Promise<void> {
  await updateDoc(doc(db, "reports", reportId), {
    status: ReportStatus.DISMISSED,
    resolvedBy,
    updatedAt: serverTimestamp(),
  });
}
