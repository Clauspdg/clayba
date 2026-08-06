import { z } from "zod";

/**
 * Duck-types a Firestore `Timestamp` without importing either the client
 * (`firebase/firestore`) or Admin (`firebase-admin/firestore`) SDK into this
 * SDK-agnostic package — both expose a parameterless `toDate(): Date`.
 */
function hasToDate(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  );
}

/**
 * Strict date schema for any field backed by a Firestore timestamp.
 *
 * Firestore's client and Admin SDKs hand back `Timestamp` instances (not
 * `Date`) for date-typed document fields; `z.date()` rejects those with the
 * unhelpful "Expected date, received object". This is the one place that
 * bridges the gap, so every schema with a Firestore-backed date field uses
 * it instead of `z.date()` directly:
 *
 * - a real `Date` (already-converted, e.g. `new Date()` in code, or a value
 *   that already passed through `createFirestoreConverter`) passes through;
 * - a Timestamp-like object (anything exposing `toDate()`) is converted;
 * - anything else — plain objects, strings, numbers, `null` — is rejected,
 *   same as `z.date()` would reject it.
 *
 * Deliberately does NOT accept a serialized `{ seconds, nanoseconds }`
 * shape: nothing in this codebase produces that representation (Firestore
 * documents are always read via the SDKs, never round-tripped through
 * `JSON.stringify`), so adding it would just be unvalidated surface area.
 */
export const firestoreDateSchema = z.preprocess((value) => {
  if (value instanceof Date) return value;
  try {
    if (hasToDate(value)) return value.toDate();
  } catch {
    // fall through — z.date() below rejects the original value with a normal ZodError
  }
  return value;
}, z.date());
