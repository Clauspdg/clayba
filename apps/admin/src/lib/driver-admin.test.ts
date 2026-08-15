import {
  DocumentReviewStatus,
  DriverApplicationStatus,
  DriverDocumentType,
  type DriverApplication,
} from "@the-ride/types";
import { canTransitionDriverApplication } from "@the-ride/utils";
import type { Firestore } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import {
  addAdminNote,
  buildInitialDriverDocuments,
  getApplicationActions,
  reviewDocument,
} from "./driver-admin";

describe("getApplicationActions", () => {
  it("never includes REJECTED — it has its own dedicated reason-requiring flow", () => {
    for (const status of Object.values(DriverApplicationStatus)) {
      expect(getApplicationActions(status)).not.toContain(DriverApplicationStatus.REJECTED);
    }
  });

  it("offers the next review stage for a freshly submitted application", () => {
    expect(getApplicationActions(DriverApplicationStatus.SUBMITTED)).toEqual([
      DriverApplicationStatus.DOCUMENTS_PENDING,
    ]);
  });

  it("offers Activate as the only action once approved", () => {
    expect(getApplicationActions(DriverApplicationStatus.APPROVED)).toEqual([
      DriverApplicationStatus.ACTIVATED,
    ]);
  });

  it("offers no actions on a terminal status", () => {
    expect(getApplicationActions(DriverApplicationStatus.ARCHIVED)).toEqual([]);
  });

  it("offers suspend/archive once activated (reinstatement lifecycle)", () => {
    expect(getApplicationActions(DriverApplicationStatus.ACTIVATED)).toEqual([
      DriverApplicationStatus.SUSPENDED,
      DriverApplicationStatus.ARCHIVED,
    ]);
  });
});

describe("canTransitionDriverApplication — Reject button gating", () => {
  // Real DEV QA (Admin Driver Application Review Workspace sprint) caught
  // `ApplicationReviewWorkspace` rendering an unconditional Reject button
  // even from APPROVED, where REJECTED isn't a legal next status — clicking
  // it would have thrown at the `assertDriverApplicationTransition` layer
  // instead of the button simply not existing. The workspace now gates the
  // button on this exact check; these lock the two cases that matter.
  it("APPROVED cannot legally reject — Reject button must stay hidden", () => {
    expect(
      canTransitionDriverApplication(
        DriverApplicationStatus.APPROVED,
        DriverApplicationStatus.REJECTED,
      ),
    ).toBe(false);
  });

  it("SUBMITTED can legally reject — Reject button must show", () => {
    expect(
      canTransitionDriverApplication(
        DriverApplicationStatus.SUBMITTED,
        DriverApplicationStatus.REJECTED,
      ),
    ).toBe(true);
  });
});

describe("reviewDocument", () => {
  // Reason validation throws before any Firestore call is made, so a
  // never-used stand-in db is safe here — it lets these tests exercise the
  // validation without standing up a Firestore emulator/mock.
  const unusedDb = {} as Firestore;

  it("rejects a REJECTED review with no reason", async () => {
    await expect(
      reviewDocument(
        unusedDb,
        "app-1",
        DriverDocumentType.DRIVERS_LICENSE,
        DocumentReviewStatus.REJECTED,
        "admin-1",
      ),
    ).rejects.toThrow(/reason is required/i);
  });

  it("rejects a REPLACEMENT_REQUIRED review with a blank reason", async () => {
    await expect(
      reviewDocument(
        unusedDb,
        "app-1",
        DriverDocumentType.DRIVERS_LICENSE,
        DocumentReviewStatus.REPLACEMENT_REQUIRED,
        "admin-1",
        "   ",
      ),
    ).rejects.toThrow(/reason is required/i);
  });
});

describe("addAdminNote", () => {
  const unusedDb = {} as Firestore;

  it("rejects an empty note body", async () => {
    await expect(addAdminNote(unusedDb, "app-1", "   ", "admin-1")).rejects.toThrow(
      /cannot be empty/i,
    );
  });
});

describe("buildInitialDriverDocuments", () => {
  // Audit fix (UX-3 sprint) — `activateApplication` used to leave
  // `driver.documents` at its schema default of `[]`, which silently
  // disabled both the Driver Space's Documents page and
  // `getOnlineEligibility`'s document-expiry gate for every real driver.
  const verifiedAt = new Date("2026-06-01T00:00:00Z");
  const baseApplication = { id: "app-1", userId: "driver-1" } as unknown as DriverApplication;

  it("carries license/insurance/profile photo over with the right types and expiry dates", () => {
    const application: DriverApplication = {
      ...baseApplication,
      license: {
        licenseNumber: "L1",
        licenseState: "NY",
        licenseExpiresAt: "2027-03-10",
        photoUrl: "https://x/license.jpg",
      },
      insurance: {
        provider: "Acme",
        policyNumber: "P1",
        expiresAt: "2027-08-31",
        photoUrl: "https://x/insurance.jpg",
      },
      profilePhotoUrl: "https://x/photo.jpg",
    } as DriverApplication;

    const documents = buildInitialDriverDocuments(application, verifiedAt);

    expect(documents).toHaveLength(3);
    const license = documents.find((d) => d.type === DriverDocumentType.DRIVERS_LICENSE);
    expect(license?.url).toBe("https://x/license.jpg");
    expect(license?.expiresAt).toEqual(new Date("2027-03-10"));
    expect(license?.verifiedAt).toBe(verifiedAt);

    const insurance = documents.find((d) => d.type === DriverDocumentType.VEHICLE_INSURANCE);
    expect(insurance?.expiresAt).toEqual(new Date("2027-08-31"));

    const photo = documents.find((d) => d.type === DriverDocumentType.PROFILE_PHOTO);
    expect(photo?.url).toBe("https://x/photo.jpg");
    expect(photo?.expiresAt).toBeUndefined();
  });

  it("only includes documents the application actually has a photo for", () => {
    const application: DriverApplication = { ...baseApplication } as DriverApplication;
    expect(buildInitialDriverDocuments(application, verifiedAt)).toEqual([]);
  });
});
