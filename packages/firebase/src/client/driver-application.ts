import {
  DriverApplicationStatus,
  driverApplicationSchema,
  type CreateDriverApplicationInput,
  type DriverApplication,
} from "@the-ride/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

const COLLECTION = "driverApplications";

/**
 * Client-side driver application access (Web Phase W1, Part 4) — a real,
 * thin wrapper over the Firestore client SDK, not a fake/in-memory
 * repository (Part 14: "no fake repositories"). Distinct from
 * `@the-ride/firebase/firestore`'s Admin-SDK `DriverApplicationsRepository`
 * (server-only, used for the review workflow); this is the client-writable
 * half an applicant's own browser session uses directly, authorized by
 * `firestore.rules` rather than a server.
 */

/**
 * Finds the signed-in user's own application regardless of status — used
 * both to resume a draft and, since the User State Experience sprint, as
 * the resolver's ground truth for every later lifecycle stage (submitted,
 * under review, approved, rejected, activated). One application per user
 * is meant to be an invariant, but nothing server-side actually enforces
 * it (`firestore.rules`' `driverApplications` create rule only checks
 * `userId == request.auth.uid`, not uniqueness) and application docs use
 * an auto-generated id rather than being keyed by `userId`, so a stray
 * duplicate is possible. `orderBy("createdAt", "desc")` makes the pick
 * deterministic in that case — the most recent application always wins,
 * rather than an unordered `limit(1)` arbitrarily returning either one
 * from call to call (Micro-Sprint A: "existing application must always be
 * found, with the correct lifecycle state, on every call").
 */
export async function findOwnApplication(
  db: Firestore,
  userId: string,
): Promise<DriverApplication | null> {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    fsLimit(1),
  );
  const snapshot = await getDocs(q);
  const found = snapshot.docs[0];
  if (!found) return null;
  return driverApplicationSchema.parse({ id: found.id, ...found.data() });
}

export async function getApplication(
  db: Firestore,
  applicationId: string,
): Promise<DriverApplication | null> {
  const snapshot = await getDoc(doc(db, COLLECTION, applicationId));
  if (!snapshot.exists()) return null;
  return driverApplicationSchema.parse({ id: snapshot.id, ...snapshot.data() });
}

/** Creates a new draft application for the signed-in user. */
export async function createDraftApplication(db: Firestore, userId: string): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  const input: CreateDriverApplicationInput = { userId, status: DriverApplicationStatus.DRAFT };
  await setDoc(ref, { ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

/** Merges new data into an existing draft/submitted application — the "draft save" every step of the wizard calls. */
export async function saveApplicationProgress(
  db: Firestore,
  applicationId: string,
  data: Partial<DriverApplication>,
): Promise<void> {
  const {
    id: _id,
    userId: _userId,
    status: _status,
    reviewedBy: _reviewedBy,
    rejectionReason: _rejectionReason,
    ...rest
  } = data;
  await updateDoc(doc(db, COLLECTION, applicationId), { ...rest, updatedAt: serverTimestamp() });
}

/** Transitions a draft to submitted — the final step's "Submit application" action. */
export async function submitApplication(db: Firestore, applicationId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, applicationId), {
    status: DriverApplicationStatus.SUBMITTED,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
