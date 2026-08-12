import { DocumentReviewStatus, DriverDocumentType, type DocumentReview } from "@the-ride/types";
import { describe, expect, it } from "vitest";

import {
  documentReviewRequiresReason,
  getDocumentComplianceSummary,
  getDocumentReviewStatus,
} from "./document-review";

function review(status: DocumentReviewStatus): DocumentReview {
  return { status, reviewedBy: "admin-1", updatedAt: new Date() };
}

describe("getDocumentReviewStatus", () => {
  it("returns pending when no reviews exist at all", () => {
    expect(getDocumentReviewStatus(undefined, DriverDocumentType.DRIVERS_LICENSE)).toBe(
      DocumentReviewStatus.PENDING,
    );
  });

  it("returns pending when this specific document was never reviewed", () => {
    const reviews = { [DriverDocumentType.VEHICLE_INSURANCE]: review(DocumentReviewStatus.VALID) };
    expect(getDocumentReviewStatus(reviews, DriverDocumentType.DRIVERS_LICENSE)).toBe(
      DocumentReviewStatus.PENDING,
    );
  });

  it("returns the recorded status when reviewed", () => {
    const reviews = { [DriverDocumentType.DRIVERS_LICENSE]: review(DocumentReviewStatus.REJECTED) };
    expect(getDocumentReviewStatus(reviews, DriverDocumentType.DRIVERS_LICENSE)).toBe(
      DocumentReviewStatus.REJECTED,
    );
  });
});

describe("getDocumentComplianceSummary", () => {
  it("is pending when nothing has been reviewed", () => {
    expect(getDocumentComplianceSummary(undefined)).toBe("pending");
  });

  it("is pending when some documents are reviewed valid but others are untouched", () => {
    const reviews = {
      [DriverDocumentType.DRIVERS_LICENSE]: review(DocumentReviewStatus.VALID),
    };
    expect(getDocumentComplianceSummary(reviews)).toBe("pending");
  });

  it("is complete only once every collected document is valid", () => {
    const reviews = {
      [DriverDocumentType.DRIVERS_LICENSE]: review(DocumentReviewStatus.VALID),
      [DriverDocumentType.VEHICLE_INSURANCE]: review(DocumentReviewStatus.VALID),
      [DriverDocumentType.PROFILE_PHOTO]: review(DocumentReviewStatus.VALID),
    };
    expect(getDocumentComplianceSummary(reviews)).toBe("complete");
  });

  it("is issues when any document is rejected, even if others are valid", () => {
    const reviews = {
      [DriverDocumentType.DRIVERS_LICENSE]: review(DocumentReviewStatus.REJECTED),
      [DriverDocumentType.VEHICLE_INSURANCE]: review(DocumentReviewStatus.VALID),
      [DriverDocumentType.PROFILE_PHOTO]: review(DocumentReviewStatus.VALID),
    };
    expect(getDocumentComplianceSummary(reviews)).toBe("issues");
  });

  it("is issues when a document needs replacement", () => {
    const reviews = {
      [DriverDocumentType.DRIVERS_LICENSE]: review(DocumentReviewStatus.REPLACEMENT_REQUIRED),
    };
    expect(getDocumentComplianceSummary(reviews)).toBe("issues");
  });

  it("is issues when a document has expired", () => {
    const reviews = {
      [DriverDocumentType.DRIVERS_LICENSE]: review(DocumentReviewStatus.EXPIRED),
    };
    expect(getDocumentComplianceSummary(reviews)).toBe("issues");
  });
});

describe("documentReviewRequiresReason", () => {
  it("requires a reason for rejected", () => {
    expect(documentReviewRequiresReason(DocumentReviewStatus.REJECTED)).toBe(true);
  });

  it("requires a reason for replacement required", () => {
    expect(documentReviewRequiresReason(DocumentReviewStatus.REPLACEMENT_REQUIRED)).toBe(true);
  });

  it("does not require a reason for valid", () => {
    expect(documentReviewRequiresReason(DocumentReviewStatus.VALID)).toBe(false);
  });

  it("does not require a reason for pending", () => {
    expect(documentReviewRequiresReason(DocumentReviewStatus.PENDING)).toBe(false);
  });

  it("does not require a reason for expired", () => {
    expect(documentReviewRequiresReason(DocumentReviewStatus.EXPIRED)).toBe(false);
  });
});
