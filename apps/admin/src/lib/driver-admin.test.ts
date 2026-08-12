import { DocumentReviewStatus, DriverApplicationStatus, DriverDocumentType } from "@the-ride/types";
import { canTransitionDriverApplication } from "@the-ride/utils";
import type { Firestore } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import { addAdminNote, getApplicationActions, reviewDocument } from "./driver-admin";

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
