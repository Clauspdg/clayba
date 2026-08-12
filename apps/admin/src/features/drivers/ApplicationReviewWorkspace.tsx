"use client";

import { DocumentThumbnailGrid, type ReviewDocument } from "@/components/DocumentViewer";
import {
  activateApplication,
  addAdminNote,
  advanceApplication,
  getApplicationActions,
  rejectApplication,
  reviewDocument,
} from "@/lib/driver-admin";
import { adminFirestore } from "@/lib/firebase-client";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorState,
  Icon,
  LoadingState,
  Select,
  Text,
  Textarea,
  useToast,
  useTranslation,
  DRIVER_APPLICATION_STATUS_LABEL_KEY,
  DRIVER_APPLICATION_STATUS_TONE,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import {
  DocumentReviewStatus,
  DriverApplicationStatus,
  DriverDocumentType,
  driverApplicationSchema,
  type DriverApplication,
} from "@the-ride/types";
import {
  canTransitionDriverApplication,
  documentReviewRequiresReason,
  getDocumentComplianceSummary,
  getDocumentReviewStatus,
} from "@the-ride/utils";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

/** Mirrors `apps/web`'s `become-a-driver` `REVIEW_PIPELINE` (kept local like that one — a display ordering, not decision logic; the actual legal-transition source of truth stays `DRIVER_APPLICATION_TRANSITIONS`). */
const REVIEW_PIPELINE = [
  DriverApplicationStatus.SUBMITTED,
  DriverApplicationStatus.DOCUMENTS_PENDING,
  DriverApplicationStatus.BACKGROUND_CHECK,
  DriverApplicationStatus.VEHICLE_INSPECTION,
  DriverApplicationStatus.INTERVIEW,
  DriverApplicationStatus.APPROVED,
  DriverApplicationStatus.ACTIVATED,
] as const;

const DOCUMENT_LABEL_KEY: Record<DriverDocumentType, string> = {
  [DriverDocumentType.DRIVERS_LICENSE]: "admin.documentReview.documentLicense",
  [DriverDocumentType.VEHICLE_INSURANCE]: "admin.documentReview.documentInsurance",
  [DriverDocumentType.VEHICLE_REGISTRATION]: "admin.documentReview.documentRegistration",
  [DriverDocumentType.BACKGROUND_CHECK]: "admin.documentReview.documentBackgroundCheck",
  [DriverDocumentType.PROFILE_PHOTO]: "admin.documentReview.documentProfilePhoto",
};

const COMPLIANCE_TONE: Record<string, "success" | "warning" | "neutral"> = {
  complete: "success",
  issues: "warning",
  pending: "neutral",
};

interface Props {
  applicationId: string;
  onBack: () => void;
}

/**
 * Admin Driver Application Review Workspace sprint, Parts 3-4 — the
 * complete dossier a reviewer needs before advancing/rejecting/activating
 * an application, opened from the Applications table's "View Application"
 * action. Subscribes to the single document in realtime (Part 24) rather
 * than a one-shot `getDoc`, so a change made from another admin session
 * (or this same one, right after a review action) reflects immediately —
 * same pattern as the table it's opened from.
 */
export function ApplicationReviewWorkspace({ applicationId, onBack }: Props) {
  const { t, locale } = useTranslation();
  const { session } = useAuth();
  const { toast } = useToast();
  const [application, setApplication] = useState<DriverApplication | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setApplication(null);
    setNotFound(false);
    setError(null);
    const unsubscribe = onSnapshot(
      doc(adminFirestore, "driverApplications", applicationId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setNotFound(true);
          return;
        }
        try {
          setApplication(driverApplicationSchema.parse({ id: snapshot.id, ...snapshot.data() }));
        } catch (err) {
          console.error("[ApplicationReviewWorkspace] failed to parse application", err);
          setError(t("admin.documentReview.loadErrorBody"));
        }
      },
      (err) => {
        console.error("[ApplicationReviewWorkspace] subscription error", err);
        setError(
          err.message.includes("permission")
            ? t("admin.documentReview.permissionDenied")
            : err.message,
        );
      },
    );
    return unsubscribe;
  }, [applicationId, t]);

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton onBack={onBack} />
        <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton onBack={onBack} />
        <ErrorState
          title={t("admin.documentReview.notFoundTitle")}
          description={t("admin.documentReview.notFoundBody")}
        />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton onBack={onBack} />
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  return (
    <ApplicationWorkspaceContent
      application={application}
      onBack={onBack}
      reviewerId={session?.uid ?? ""}
      reviewerName={session?.displayName ?? session?.email ?? undefined}
      t={t}
      locale={locale}
      toast={toast}
    />
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <Button variant="ghost" size="sm" onClick={onBack} className="w-fit">
      <Icon name="arrowLeft" size={16} />
      {t("admin.documentReview.backToApplications")}
    </Button>
  );
}

function formatDate(date: Date | undefined, locale: string): string {
  return date ? date.toLocaleDateString(locale, { dateStyle: "medium" }) : "—";
}

function ApplicationWorkspaceContent({
  application,
  onBack,
  reviewerId,
  reviewerName,
  t,
  locale,
  toast,
}: {
  application: DriverApplication;
  onBack: () => void;
  reviewerId: string;
  reviewerName?: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  toast: (opts: { variant: "success" | "danger"; title: string }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmingAdvance, setConfirmingAdvance] = useState<DriverApplicationStatus | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activating, setActivating] = useState(false);
  const [activationChecks, setActivationChecks] = useState<Record<string, boolean>>({});
  const [reviewingDoc, setReviewingDoc] = useState<DriverDocumentType | null>(null);
  const [docReviewStatus, setDocReviewStatus] = useState<DocumentReviewStatus>(
    DocumentReviewStatus.VALID,
  );
  const [docReviewReason, setDocReviewReason] = useState("");
  const [noteBody, setNoteBody] = useState("");

  const actions = getApplicationActions(application.status);
  const isRejected = application.status === DriverApplicationStatus.REJECTED;
  const isActivated = application.status === DriverApplicationStatus.ACTIVATED;
  const canReject = canTransitionDriverApplication(
    application.status,
    DriverApplicationStatus.REJECTED,
  );
  const compliance = getDocumentComplianceSummary(application.documentReviews);

  const documents: ReviewDocument[] = [
    {
      key: DriverDocumentType.DRIVERS_LICENSE,
      label: t(DOCUMENT_LABEL_KEY[DriverDocumentType.DRIVERS_LICENSE]),
      url: application.license?.photoUrl,
      reviewStatus: getDocumentReviewStatus(
        application.documentReviews,
        DriverDocumentType.DRIVERS_LICENSE,
      ),
    },
    {
      key: DriverDocumentType.VEHICLE_INSURANCE,
      label: t(DOCUMENT_LABEL_KEY[DriverDocumentType.VEHICLE_INSURANCE]),
      url: application.insurance?.photoUrl,
      reviewStatus: getDocumentReviewStatus(
        application.documentReviews,
        DriverDocumentType.VEHICLE_INSURANCE,
      ),
    },
    {
      key: DriverDocumentType.PROFILE_PHOTO,
      label: t(DOCUMENT_LABEL_KEY[DriverDocumentType.PROFILE_PHOTO]),
      url: application.profilePhotoUrl,
      reviewStatus: getDocumentReviewStatus(
        application.documentReviews,
        DriverDocumentType.PROFILE_PHOTO,
      ),
    },
  ];

  const currentPipelineIndex = REVIEW_PIPELINE.indexOf(
    application.status as (typeof REVIEW_PIPELINE)[number],
  );

  async function handleAdvance(to: DriverApplicationStatus) {
    setBusy(true);
    try {
      await advanceApplication(adminFirestore, application, to);
      toast({ variant: "success", title: t("admin.drivers.advanced") });
      setConfirmingAdvance(null);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) return;
    setBusy(true);
    try {
      await rejectApplication(adminFirestore, application, rejectionReason.trim());
      toast({ variant: "success", title: t("admin.drivers.rejected") });
      setRejecting(false);
      setRejectionReason("");
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusy(false);
    }
  }

  async function handleActivate() {
    setBusy(true);
    try {
      await activateApplication(adminFirestore, application, reviewerId);
      toast({ variant: "success", title: t("admin.drivers.activated") });
      setActivating(false);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusy(false);
    }
  }

  async function handleReviewDocument() {
    if (!reviewingDoc) return;
    setBusy(true);
    try {
      await reviewDocument(
        adminFirestore,
        application.id,
        reviewingDoc,
        docReviewStatus,
        reviewerId,
        docReviewReason,
      );
      toast({ variant: "success", title: t("admin.documentReview.reviewSaved") });
      setReviewingDoc(null);
      setDocReviewReason("");
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusy(false);
    }
  }

  async function handleAddNote() {
    if (!noteBody.trim()) return;
    setBusy(true);
    try {
      await addAdminNote(adminFirestore, application.id, noteBody, reviewerId, reviewerName);
      setNoteBody("");
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusy(false);
    }
  }

  const activationRequiredChecks = [
    "admin.documentReview.activationCheckLicense",
    "admin.documentReview.activationCheckInsurance",
    "admin.documentReview.activationCheckVehicle",
    "admin.documentReview.activationCheckIdentity",
  ];
  const allChecksConfirmed = activationRequiredChecks.every((key) => activationChecks[key]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton onBack={onBack} />
        <Badge tone={DRIVER_APPLICATION_STATUS_TONE[application.status]}>
          {t(DRIVER_APPLICATION_STATUS_LABEL_KEY[application.status])}
        </Badge>
      </div>

      {/* 1. Application Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.documentReview.sectionOverview")}</CardTitle>
        </CardHeader>
        <CardContent className="tablet:grid-cols-2 grid gap-4">
          <OverviewRow label={t("admin.documentReview.applicationId")} value={application.id} />
          <OverviewRow
            label={t("admin.documentReview.applicantName")}
            value={
              application.personalInfo
                ? `${application.personalInfo.firstName} ${application.personalInfo.lastName}`
                : "—"
            }
          />
          <OverviewRow label={t("admin.documentReview.uid")} value={application.userId} />
          <OverviewRow
            label={t("admin.documentReview.complianceStatus")}
            value={
              <Badge tone={COMPLIANCE_TONE[compliance]}>
                {t(`admin.documentReview.compliance.${compliance}`)}
              </Badge>
            }
          />
          <OverviewRow
            label={t("admin.documentReview.createdDate")}
            value={formatDate(application.createdAt, locale)}
          />
          <OverviewRow
            label={t("admin.documentReview.submittedDate")}
            value={formatDate(application.submittedAt, locale)}
          />
          <OverviewRow
            label={t("admin.documentReview.lastUpdated")}
            value={formatDate(application.updatedAt, locale)}
          />
        </CardContent>
      </Card>

      {/* 2. Applicant Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.documentReview.sectionApplicant")}</CardTitle>
        </CardHeader>
        <CardContent className="tablet:grid-cols-2 grid gap-4">
          {application.personalInfo ? (
            <>
              <OverviewRow
                label={t("auth.fullNameLabel")}
                value={`${application.personalInfo.firstName} ${application.personalInfo.lastName}`}
              />
              <OverviewRow
                label={t("auth.phoneLabel")}
                value={application.personalInfo.phoneNumber}
              />
              <OverviewRow
                label={t("becomeDriver.dateOfBirth")}
                value={application.personalInfo.dateOfBirth}
              />
              <OverviewRow
                label={t("becomeDriver.address")}
                value={application.personalInfo.address}
              />
              <OverviewRow label={t("becomeDriver.city")} value={application.personalInfo.city} />
            </>
          ) : (
            <Text tone="muted">{t("admin.documentReview.noData")}</Text>
          )}
        </CardContent>
      </Card>

      {/* 3. Driver License */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t("admin.documentReview.sectionLicense")}
            <ReviewDocButton
              onClick={() => {
                setReviewingDoc(DriverDocumentType.DRIVERS_LICENSE);
                setDocReviewStatus(
                  getDocumentReviewStatus(
                    application.documentReviews,
                    DriverDocumentType.DRIVERS_LICENSE,
                  ),
                );
              }}
              t={t}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {application.license ? (
            <div className="tablet:grid-cols-2 grid gap-4">
              <OverviewRow
                label={t("becomeDriver.licenseNumber")}
                value={application.license.licenseNumber}
              />
              <OverviewRow
                label={t("becomeDriver.licenseState")}
                value={application.license.licenseState}
              />
              <OverviewRow
                label={t("becomeDriver.licenseExpiresAt")}
                value={application.license.licenseExpiresAt}
              />
            </div>
          ) : (
            <Text tone="muted">{t("admin.documentReview.noData")}</Text>
          )}
          <DocumentThumbnailGrid documents={[documents[0]!]} />
        </CardContent>
      </Card>

      {/* 4. Vehicle */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.documentReview.sectionVehicle")}</CardTitle>
        </CardHeader>
        <CardContent className="tablet:grid-cols-2 grid gap-4">
          {application.vehicleInfo ? (
            <>
              <OverviewRow
                label={t("becomeDriver.vehicleMake")}
                value={application.vehicleInfo.make}
              />
              <OverviewRow
                label={t("becomeDriver.vehicleModel")}
                value={application.vehicleInfo.model}
              />
              <OverviewRow
                label={t("becomeDriver.vehicleYear")}
                value={String(application.vehicleInfo.year)}
              />
              <OverviewRow
                label={t("becomeDriver.vehicleColor")}
                value={application.vehicleInfo.color}
              />
              <OverviewRow
                label={t("becomeDriver.vehiclePlate")}
                value={application.vehicleInfo.plateNumber}
              />
            </>
          ) : (
            <Text tone="muted">{t("admin.documentReview.noData")}</Text>
          )}
        </CardContent>
      </Card>

      {/* 5. Insurance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t("admin.documentReview.sectionInsurance")}
            <ReviewDocButton
              onClick={() => {
                setReviewingDoc(DriverDocumentType.VEHICLE_INSURANCE);
                setDocReviewStatus(
                  getDocumentReviewStatus(
                    application.documentReviews,
                    DriverDocumentType.VEHICLE_INSURANCE,
                  ),
                );
              }}
              t={t}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {application.insurance ? (
            <div className="tablet:grid-cols-2 grid gap-4">
              <OverviewRow
                label={t("becomeDriver.insuranceProvider")}
                value={application.insurance.provider}
              />
              <OverviewRow
                label={t("becomeDriver.policyNumber")}
                value={application.insurance.policyNumber}
              />
              <OverviewRow
                label={t("becomeDriver.insuranceExpiresAt")}
                value={application.insurance.expiresAt}
              />
            </div>
          ) : (
            <Text tone="muted">{t("admin.documentReview.noData")}</Text>
          )}
          <DocumentThumbnailGrid documents={[documents[1]!]} />
        </CardContent>
      </Card>

      {/* 6-7. Profile Photo (Uploaded Documents grouped together) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t("admin.documentReview.sectionProfilePhoto")}
            <ReviewDocButton
              onClick={() => {
                setReviewingDoc(DriverDocumentType.PROFILE_PHOTO);
                setDocReviewStatus(
                  getDocumentReviewStatus(
                    application.documentReviews,
                    DriverDocumentType.PROFILE_PHOTO,
                  ),
                );
              }}
              t={t}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar src={application.profilePhotoUrl} alt="" size="lg" fallback="?" />
          <DocumentThumbnailGrid documents={[documents[2]!]} />
        </CardContent>
      </Card>

      {/* 8. Background Check — no dedicated backend field exists yet (only the review-pipeline stage name); disclosed rather than faked. */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.documentReview.sectionBackgroundCheck")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text tone="muted" size="sm">
            {t("admin.documentReview.backgroundCheckGap")}
          </Text>
        </CardContent>
      </Card>

      {/* 9. Review Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.documentReview.sectionTimeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isRejected ? (
            <div className="flex flex-col gap-2">
              <TimelineRow
                label={t("admin.documentReview.timelineCreated")}
                date={formatDate(application.createdAt, locale)}
                done
              />
              {application.submittedAt && (
                <TimelineRow
                  label={t("admin.documentReview.timelineSubmitted")}
                  date={formatDate(application.submittedAt, locale)}
                  done
                />
              )}
              <TimelineRow
                label={t(DRIVER_APPLICATION_STATUS_LABEL_KEY[DriverApplicationStatus.REJECTED])}
                date={formatDate(application.updatedAt, locale)}
                done
                danger
              />
              {application.rejectionReason && (
                <Alert tone="danger" title={t("admin.drivers.rejectionReason")} className="mt-2">
                  {application.rejectionReason}
                </Alert>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {REVIEW_PIPELINE.map((stage, index) => {
                const done = currentPipelineIndex >= 0 && index <= currentPipelineIndex;
                const isCurrent = index === currentPipelineIndex;
                return (
                  <TimelineRow
                    key={stage}
                    label={t(DRIVER_APPLICATION_STATUS_LABEL_KEY[stage])}
                    date={
                      stage === DriverApplicationStatus.SUBMITTED
                        ? formatDate(application.submittedAt, locale)
                        : isCurrent
                          ? formatDate(application.updatedAt, locale)
                          : undefined
                    }
                    done={done}
                    current={isCurrent}
                  />
                );
              })}
            </div>
          )}
          <Text size="xs" tone="muted" className="mt-3">
            {t("admin.documentReview.timelineDisclosure")}
          </Text>
        </CardContent>
      </Card>

      {/* 10. Admin Notes */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.documentReview.sectionNotes")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {application.adminNotes && application.adminNotes.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {[...application.adminNotes]
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .map((note) => (
                  <li
                    key={note.id}
                    className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Text size="xs" weight="medium">
                        {note.authorName ?? note.authorId}
                      </Text>
                      <Text size="xs" tone="muted">
                        {formatDate(note.createdAt, locale)}
                      </Text>
                    </div>
                    <Text size="sm">{note.body}</Text>
                  </li>
                ))}
            </ul>
          ) : (
            <Text tone="muted" size="sm">
              {t("admin.documentReview.noNotes")}
            </Text>
          )}
          <div className="flex flex-col gap-2">
            <Textarea
              label={t("admin.documentReview.addNoteLabel")}
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={2}
            />
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              disabled={!noteBody.trim() || busy}
              onClick={() => void handleAddNote()}
            >
              {t("admin.documentReview.addNoteCta")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 11. Decision / Review Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.documentReview.sectionActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isRejected || isActivated ? (
            <Text tone="muted" size="sm">
              {isRejected
                ? t("admin.documentReview.readOnlyRejected")
                : application.status === DriverApplicationStatus.ACTIVATED
                  ? t("admin.documentReview.readOnlyActivated")
                  : null}
            </Text>
          ) : (
            <div className="flex flex-wrap gap-3">
              {actions.map((next) =>
                next === DriverApplicationStatus.ACTIVATED ? (
                  <Button key={next} onClick={() => setActivating(true)} disabled={busy}>
                    {t("admin.drivers.activate")}
                  </Button>
                ) : (
                  <Button
                    key={next}
                    variant="outline"
                    onClick={() => setConfirmingAdvance(next)}
                    disabled={busy}
                  >
                    {t("admin.documentReview.advanceTo", {
                      status: t(DRIVER_APPLICATION_STATUS_LABEL_KEY[next]),
                    })}
                  </Button>
                ),
              )}
              {canReject && (
                <Button variant="destructive" onClick={() => setRejecting(true)} disabled={busy}>
                  {t("admin.drivers.reject")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advance confirmation */}
      <Dialog
        open={Boolean(confirmingAdvance)}
        onOpenChange={(open) => !open && setConfirmingAdvance(null)}
      >
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("admin.documentReview.confirmAdvanceTitle")}</DialogTitle>
            <DialogDescription>
              {confirmingAdvance &&
                t("admin.documentReview.confirmAdvanceBody", {
                  status: t(DRIVER_APPLICATION_STATUS_LABEL_KEY[confirmingAdvance]),
                })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingAdvance(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              isLoading={busy}
              onClick={() => confirmingAdvance && void handleAdvance(confirmingAdvance)}
            >
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog — reason required */}
      <Dialog open={rejecting} onOpenChange={(open) => !open && setRejecting(false)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("admin.drivers.rejectTitle")}</DialogTitle>
            <DialogDescription>{t("admin.drivers.rejectDescription")}</DialogDescription>
          </DialogHeader>
          <Textarea
            label={t("admin.drivers.rejectionReason")}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleReject()}
              isLoading={busy}
              disabled={!rejectionReason.trim()}
            >
              {t("admin.drivers.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate — eligibility checklist confirmation */}
      <Dialog open={activating} onOpenChange={(open) => !open && setActivating(false)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("admin.documentReview.activateTitle")}</DialogTitle>
            <DialogDescription>{t("admin.documentReview.activateBody")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {activationRequiredChecks.map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(activationChecks[key])}
                  onCheckedChange={(checked) =>
                    setActivationChecks((c) => ({ ...c, [key]: checked === true }))
                  }
                />
                {t(key)}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivating(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => void handleActivate()}
              isLoading={busy}
              disabled={!allChecksConfirmed}
            >
              {t("admin.drivers.activate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document review dialog */}
      <Dialog open={Boolean(reviewingDoc)} onOpenChange={(open) => !open && setReviewingDoc(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("admin.documentReview.reviewDocumentTitle")}</DialogTitle>
            {reviewingDoc && (
              <DialogDescription>{t(DOCUMENT_LABEL_KEY[reviewingDoc])}</DialogDescription>
            )}
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Select
              label={t("admin.documentReview.statusLabel")}
              value={docReviewStatus}
              onValueChange={(value) => setDocReviewStatus(value as DocumentReviewStatus)}
              options={Object.values(DocumentReviewStatus).map((status) => ({
                value: status,
                label: t(`admin.documentReview.status.${status}`),
              }))}
            />
            {documentReviewRequiresReason(docReviewStatus) && (
              <Textarea
                label={t("admin.documentReview.reasonLabel")}
                value={docReviewReason}
                onChange={(e) => setDocReviewReason(e.target.value)}
                rows={3}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewingDoc(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => void handleReviewDocument()}
              isLoading={busy}
              disabled={documentReviewRequiresReason(docReviewStatus) && !docReviewReason.trim()}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewDocButton({ onClick, t }: { onClick: () => void; t: (key: string) => string }) {
  return (
    <Button size="sm" variant="outline" onClick={onClick}>
      {t("admin.documentReview.reviewDocumentCta")}
    </Button>
  );
}

function OverviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Text size="xs" tone="muted">
        {label}
      </Text>
      <Text size="sm" weight="medium">
        {value || "—"}
      </Text>
    </div>
  );
}

function TimelineRow({
  label,
  date,
  done,
  current,
  danger,
}: {
  label: string;
  date?: string;
  done?: boolean;
  current?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-100 py-2 last:border-0 dark:border-neutral-800">
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          danger
            ? "bg-danger"
            : done
              ? current
                ? "bg-brand"
                : "bg-success"
              : "bg-neutral-300 dark:bg-neutral-700"
        }`}
      />
      <Text size="sm" weight={current ? "medium" : "regular"} className="flex-1">
        {label}
      </Text>
      {date && (
        <Text size="xs" tone="muted">
          {date}
        </Text>
      )}
    </div>
  );
}
