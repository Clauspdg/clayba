import { DocumentReviewStatus, DriverDocumentType, type DocumentReview } from "@the-ride/types";

/**
 * Admin Driver Application Review Workspace sprint — the only three
 * document types a `DriverApplication` actually collects (see
 * `become-a-driver`'s wizard: license photo, insurance photo, profile
 * photo — never `vehicle_registration`/`background_check`, which exist in
 * `DriverDocumentType` for the driver-facing document-upload flow this
 * application doesn't use). Reviewing a document that was never
 * collected wouldn't mean anything, so this is the fixed set the review
 * workspace iterates.
 */
export const APPLICATION_DOCUMENT_TYPES: readonly DriverDocumentType[] = [
  DriverDocumentType.DRIVERS_LICENSE,
  DriverDocumentType.VEHICLE_INSURANCE,
  DriverDocumentType.PROFILE_PHOTO,
];

/** A document with no review yet reads as `pending` — distinct from an explicit `DocumentReviewStatus.PENDING` a reviewer chose, but the same value, so callers don't need to special-case "never reviewed" separately. */
export function getDocumentReviewStatus(
  reviews: Record<string, DocumentReview> | undefined,
  documentType: DriverDocumentType,
): DocumentReviewStatus {
  return reviews?.[documentType]?.status ?? DocumentReviewStatus.PENDING;
}

/**
 * Overall compliance summary shown on the Applications table row and the
 * workspace overview (Part 5/12) — "complete" only once every collected
 * document is explicitly `valid`; "issues" if anything was flagged; else
 * "pending" (the common case: nothing reviewed yet, or still in
 * progress).
 */
export type DocumentComplianceSummary = "complete" | "issues" | "pending";

export function getDocumentComplianceSummary(
  reviews: Record<string, DocumentReview> | undefined,
): DocumentComplianceSummary {
  const statuses = APPLICATION_DOCUMENT_TYPES.map((type) => getDocumentReviewStatus(reviews, type));
  if (
    statuses.some(
      (s) =>
        s === DocumentReviewStatus.REJECTED ||
        s === DocumentReviewStatus.REPLACEMENT_REQUIRED ||
        s === DocumentReviewStatus.EXPIRED,
    )
  ) {
    return "issues";
  }
  if (statuses.every((s) => s === DocumentReviewStatus.VALID)) {
    return "complete";
  }
  return "pending";
}

/** A reason is required for these two outcomes — the applicant needs to know what's wrong and, for replacement, what to fix (Part 12/13). */
export function documentReviewRequiresReason(status: DocumentReviewStatus): boolean {
  return (
    status === DocumentReviewStatus.REJECTED || status === DocumentReviewStatus.REPLACEMENT_REQUIRED
  );
}
