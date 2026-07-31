import { DOCUMENT_EXPIRATION_WARNING_DAYS, type DriverDocument } from "@the-ride/types";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type DocumentExpirationStatus = "expired" | "expiring_soon" | "valid" | "no_expiration";

export function getDaysUntilExpiration(expiresAt: Date, now: Date = new Date()): number {
  return Math.ceil((expiresAt.getTime() - now.getTime()) / MS_PER_DAY);
}

export function getDocumentExpirationStatus(
  expiresAt: Date | undefined,
  now: Date = new Date(),
  warningDays: number = DOCUMENT_EXPIRATION_WARNING_DAYS,
): DocumentExpirationStatus {
  if (!expiresAt) return "no_expiration";

  const daysUntilExpiration = getDaysUntilExpiration(expiresAt, now);
  if (daysUntilExpiration < 0) return "expired";
  if (daysUntilExpiration <= warningDays) return "expiring_soon";
  return "valid";
}

export function isDocumentExpiringSoon(
  expiresAt: Date | undefined,
  now: Date = new Date(),
  warningDays: number = DOCUMENT_EXPIRATION_WARNING_DAYS,
): boolean {
  return getDocumentExpirationStatus(expiresAt, now, warningDays) === "expiring_soon";
}

/** Filters a driver's documents down to the ones that are expired or expiring soon. */
export function getExpiringDocuments(documents: DriverDocument[], now: Date = new Date()): DriverDocument[] {
  return documents.filter((document) => {
    const status = getDocumentExpirationStatus(document.expiresAt, now);
    return status === "expired" || status === "expiring_soon";
  });
}
