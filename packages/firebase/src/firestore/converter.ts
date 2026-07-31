import { Timestamp, type DocumentData, type FirestoreDataConverter, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { ZodType, ZodTypeDef } from "zod";

function convertTimestamps(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(convertTimestamps);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, v]) => [key, convertTimestamps(v)]));
  }
  return value;
}

/**
 * Builds a `FirestoreDataConverter` from a Zod schema, so every document
 * read is validated against the same source of truth used everywhere else
 * (`packages/types`). This is the ONLY place that should construct a
 * converter — see `docs/firestore-schema.md`.
 *
 * The schema parameter is typed as `ZodType<T, ZodTypeDef, unknown>` rather
 * than the more obvious `ZodType<T>`: schemas with `.default(...)` have a
 * narrower (more optional) input type than output type, and letting
 * TypeScript infer `T` from a schema's input side would silently produce a
 * converter typed with optional fields that are actually always present
 * after parsing. Pinning input to `unknown` forces inference from the
 * output side only.
 */
export function createFirestoreConverter<T extends { id: string }>(
  schema: ZodType<T, ZodTypeDef, unknown>,
): FirestoreDataConverter<T> {
  return {
    toFirestore(model: T): DocumentData {
      const { id: _id, ...rest } = model;
      return rest as DocumentData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      const raw = snapshot.data();
      return schema.parse(convertTimestamps({ id: snapshot.id, ...raw }));
    },
  };
}
