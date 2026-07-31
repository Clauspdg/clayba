import { createAuditLogInputSchema, type CreateAuditLogInput } from "@the-ride/types";

export type BuildAuditLogEntryParams = CreateAuditLogInput;

/**
 * Validates and normalizes the fields of a sensitive-operation audit
 * record. Pure function — persistence happens in
 * `@the-ride/firebase`'s `AuditLogsRepository.record()`, which calls this
 * first and then stamps `id`/`createdAt` on write.
 *
 * Throws a ZodError if a required field (action/actorId/actorRole) is
 * missing or malformed, so a bad call site fails loudly instead of writing
 * an incomplete audit trail.
 */
export function buildAuditLogEntry(params: BuildAuditLogEntryParams): CreateAuditLogInput {
  return createAuditLogInputSchema.parse(params);
}
