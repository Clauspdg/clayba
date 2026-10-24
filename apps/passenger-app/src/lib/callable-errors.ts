/**
 * The app only depends on the Firebase SDK through `@the-ride/firebase`,
 * so `FirebaseError` isn't importable here for an `instanceof` check —
 * a callable's `HttpsError` is recognized by its `code` instead.
 */
export function isFailedPrecondition(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "functions/failed-precondition"
  );
}
