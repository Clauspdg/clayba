import type { ZodSchema } from "zod";

export * from "./schema";

/**
 * Validates a `process.env`-shaped object against any of the schemas in
 * `./schema.ts` and throws a readable, multi-line error listing every
 * missing/invalid variable — instead of failing much later with a cryptic
 * "Cannot read properties of undefined" deep inside Firebase init code.
 *
 * Call this once at each app's entry point (e.g. `next.config.ts`, or the
 * top of a Cloud Function's `index.ts`), not on every request.
 *
 * `source` is typed as a plain record (not `NodeJS.ProcessEnv`) so this
 * package doesn't need `@types/node` as a dependency — pass `process.env`
 * explicitly from the caller, which already has that ambient type.
 */
export function validateEnv<T>(schema: ZodSchema<T>, source: Record<string, string | undefined>): T {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
