"use client";

import {
  uploadDriverDocument,
  uploadDriverProfilePhoto,
  createDraftApplication,
  saveApplicationProgress,
  submitApplication,
} from "@the-ride/firebase/client";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Divider,
  ErrorState,
  Heading,
  Input,
  LoadingState,
  Progress,
  Text,
  useToast,
  useTranslation,
  DRIVER_APPLICATION_STATUS_LABEL_KEY,
  DRIVER_APPLICATION_STATUS_TONE,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import { DriverApplicationStatus, type DriverApplication } from "@the-ride/types";
import { isDriverApplicantState, isDriverState } from "@the-ride/utils";
import { FirebaseError } from "firebase/app";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ZodError } from "zod";

import { useUserExperience } from "@/hooks/useUserExperience";
import { webFirestore } from "@/lib/firebase-client";

const STEP_KEYS = ["personal", "license", "vehicle", "insurance", "photo", "review"] as const;
type StepKey = (typeof STEP_KEYS)[number];

interface FormState {
  personalInfo: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: string;
    address: string;
    city: string;
  };
  license: {
    licenseNumber: string;
    licenseState: string;
    licenseExpiresAt: string;
    photoUrl?: string;
  };
  vehicleInfo: { make: string; model: string; year: string; color: string; plateNumber: string };
  insurance: { provider: string; policyNumber: string; expiresAt: string; photoUrl?: string };
  profilePhotoUrl?: string;
}

const EMPTY_FORM: FormState = {
  personalInfo: {
    firstName: "",
    lastName: "",
    phoneNumber: "",
    dateOfBirth: "",
    address: "",
    city: "",
  },
  license: { licenseNumber: "", licenseState: "", licenseExpiresAt: "" },
  vehicleInfo: { make: "", model: "", year: "", color: "", plateNumber: "" },
  insurance: { provider: "", policyNumber: "", expiresAt: "" },
};

/**
 * A raw Firebase/Zod error message ("permission-denied", "Expected date,
 * received object", ...) is developer-facing — the caller always logs the
 * real error separately for debugging. This only decides what's safe and
 * useful to show the applicant.
 */
function describeSaveError(err: unknown, t: (key: string) => string): string {
  if (err instanceof FirebaseError && err.code === "permission-denied") {
    return t("becomeDriver.saveErrorPermission");
  }
  return t("becomeDriver.saveErrorGeneric");
}

// Photo upload constants — sizes mirror storage.rules' isUnder5MB(); types
// are a stricter allowlist than storage.rules' isImage() (any image/*) so
// applicants get an instant, specific error instead of a vague upload failure.
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 20_000;

type UploadStatus = "idle" | "uploading" | "success" | "error";

/**
 * The Firebase Storage JS SDK retries network-classified failures (which is
 * how a CORS/connection error against a bucket that was never provisioned
 * shows up in-browser) for its own internal ceiling — long enough that the
 * "Loading..." state would otherwise look permanently stuck. This bounds
 * every upload attempt to a fixed, user-visible timeout instead.
 */
class UploadTimeoutError extends Error {
  constructor() {
    super("upload timed out");
    this.name = "UploadTimeoutError";
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new UploadTimeoutError()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/** Raw Storage error codes are developer-facing; this decides the translated, user-safe message — always paired with a console.error of the real error. */
function describeUploadError(err: unknown, t: (key: string) => string): string {
  if (err instanceof UploadTimeoutError) return t("becomeDriver.uploadServiceUnavailable");
  if (err instanceof FirebaseError && err.code.startsWith("storage/")) {
    if (err.code === "storage/unauthorized" || err.code === "storage/unauthenticated") {
      return t("becomeDriver.uploadFailed");
    }
    return t("becomeDriver.uploadServiceUnavailable");
  }
  return t("becomeDriver.uploadFailed");
}

function fromApplication(app: DriverApplication): FormState {
  return {
    personalInfo: app.personalInfo ?? EMPTY_FORM.personalInfo,
    license: app.license ?? EMPTY_FORM.license,
    vehicleInfo: app.vehicleInfo
      ? { ...app.vehicleInfo, year: String(app.vehicleInfo.year) }
      : EMPTY_FORM.vehicleInfo,
    insurance: app.insurance ?? EMPTY_FORM.insurance,
    profilePhotoUrl: app.profilePhotoUrl,
  };
}

/**
 * FUNCTIONAL-STABILIZATION — resuming a draft always reopened the wizard at
 * `STEP_KEYS[0]` ("personal") regardless of how much was already saved: data
 * wasn't lost (`fromApplication` above pre-fills every field), but a
 * passenger who'd finished 3 of 5 sections still had to click Next through
 * work they'd already done. This mirrors `useApplicationCompleteness`'s own
 * "done" checks (same section order, same fields) so the step this opens on
 * always agrees with the completeness list `ContinueApplicationScreen`
 * already shows — first incomplete section, or "review" if all 5 are done.
 */
function firstIncompleteStepIndex(app: DriverApplication): number {
  const done = [
    Boolean(app.personalInfo),
    Boolean(app.license?.photoUrl),
    Boolean(app.vehicleInfo),
    Boolean(app.insurance?.photoUrl),
    Boolean(app.profilePhotoUrl),
  ];
  const firstIncomplete = done.findIndex((isDone) => !isDone);
  return firstIncomplete === -1 ? STEP_KEYS.indexOf("review") : firstIncomplete;
}

/**
 * Lifecycle-aware entry point (User State Experience sprint, Parts 4-9) —
 * routes to a dedicated screen per `ExperienceState` instead of always
 * dropping every authenticated visitor straight into the six-step wizard.
 * `ApplicationWizard` itself is unchanged and only mounts once the visitor
 * explicitly starts or resumes (`wizardOpen`), so its own tested
 * draft-resume/create logic stays exactly as it was.
 */
export default function BecomeADriverPage() {
  const { t } = useTranslation();
  const { status, session } = useAuth();
  const router = useRouter();
  const {
    experience: state,
    loading,
    error,
    currentApplication: driverApplication,
    driver,
    blockingReason,
  } = useUserExperience();
  const [wizardOpen, setWizardOpen] = useState(false);

  // UX-3 sprint (Dedicated Driver Space), Part 26 — `/become-a-driver` is
  // the applicant/onboarding path only now; anyone with a real
  // `drivers/{uid}` record (active, suspended, or inactive) belongs in the
  // dedicated `/driver` space instead, which renders its own restricted
  // view for suspended/inactive rather than this page pretending to be an
  // operational dashboard. Visiting this URL directly as an active driver
  // must never restart the application wizard — this redirect fires before
  // `wizardOpen` (or anything else on this page) can render.
  useEffect(() => {
    if (isDriverState(state) && driver) {
      router.replace("/driver");
    }
  }, [state, driver, router]);

  if (status === "loading" || loading || (status === "authenticated" && state === null)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <section className="mx-auto max-w-xl px-6 py-16 text-center">
        <Heading level={1} className="mb-4">
          {t("becomeDriver.title")}
        </Heading>
        <Text size="lg" tone="muted" className="mb-8">
          {t("becomeDriver.subtitle")}
        </Text>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/register">{t("auth.signUp")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">{t("auth.logIn")}</Link>
          </Button>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ErrorState title={t("becomeDriver.loadErrorTitle")} description={error} />
      </div>
    );
  }

  if (isDriverState(state) && driver) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  if (wizardOpen) {
    return <ApplicationWizard userId={session.uid} existingApplication={driverApplication} />;
  }

  const content = (() => {
    if (isDriverApplicantState(state) && driverApplication) {
      switch (driverApplication.status) {
        case DriverApplicationStatus.DRAFT:
          return (
            <ContinueApplicationScreen
              application={driverApplication}
              onResume={() => setWizardOpen(true)}
            />
          );
        case DriverApplicationStatus.APPROVED:
          return <ApprovedScreen application={driverApplication} />;
        case DriverApplicationStatus.REJECTED:
          return <RejectedScreen application={driverApplication} />;
        default:
          return <StatusPortalScreen application={driverApplication} />;
      }
    }

    // PASSENGER (or a staff role browsing this page directly) — no
    // application or driver record yet.
    return <EligibilityScreen onStart={() => setWizardOpen(true)} />;
  })();

  return (
    <>
      {/* UX-2 sprint, Part 16 — surfaces UX-1's `blockingReason` (a genuinely
          inconsistent data state, e.g. an activated application with no
          driver record yet) instead of silently hiding it behind whatever
          screen the resolver otherwise picked. Never blocks the page. */}
      {blockingReason && (
        <div className="mx-auto max-w-2xl px-6 pt-8">
          <Alert tone="warning" title={t("becomeDriver.inconsistentStateTitle")}>
            {blockingReason}
          </Alert>
        </div>
      )}
      {content}
    </>
  );
}

function StatusBadge({ status }: { status: DriverApplicationStatus }) {
  const { t } = useTranslation();
  return (
    <Badge tone={DRIVER_APPLICATION_STATUS_TONE[status]}>
      {t(DRIVER_APPLICATION_STATUS_LABEL_KEY[status])}
    </Badge>
  );
}

/** Part 4 — authenticated user, no application yet. */
function EligibilityScreen({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-8 text-center">
        <Heading level={1} className="mb-3">
          {t("becomeDriver.eligibilityTitle")}
        </Heading>
        <Text size="lg" tone="muted">
          {t("becomeDriver.eligibilityBody")}
        </Text>
      </div>
      <Card className="shadow-elevation1">
        <CardContent className="flex flex-col gap-6 p-8">
          <ChecklistSection
            title={t("becomeDriver.eligibilityHeading")}
            items={[
              t("becomeDriver.eligibility1"),
              t("becomeDriver.eligibility2"),
              t("becomeDriver.eligibility3"),
              t("becomeDriver.eligibility4"),
            ]}
          />
          <Divider />
          <ChecklistSection
            title={t("becomeDriver.benefitsHeading")}
            items={[
              t("becomeDriver.benefit1"),
              t("becomeDriver.benefit2"),
              t("becomeDriver.benefit3"),
            ]}
          />
          <Divider />
          <ChecklistSection
            title={t("becomeDriver.documentChecklistHeading")}
            items={[
              t("becomeDriver.checklistLicense"),
              t("becomeDriver.checklistInsurance"),
              t("becomeDriver.checklistVehicleInfo"),
              t("becomeDriver.checklistProfilePhoto"),
            ]}
          />
          <Button size="lg" fullWidth onClick={onStart}>
            {t("becomeDriver.startApplicationCta")}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function ChecklistSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <Heading level={4}>{title}</Heading>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300"
          >
            <span className="bg-brand mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** How complete each of the wizard's six sections is, from real saved data — shared by the Continue and Status Portal screens. */
function useApplicationCompleteness(application: DriverApplication) {
  return useMemo(() => {
    const sections: { key: string; label: string; done: boolean }[] = [
      {
        key: "personal",
        label: "becomeDriver.stepPersonal",
        done: Boolean(application.personalInfo),
      },
      {
        key: "license",
        label: "becomeDriver.license",
        done: Boolean(application.license?.photoUrl),
      },
      { key: "vehicle", label: "becomeDriver.vehicle", done: Boolean(application.vehicleInfo) },
      {
        key: "insurance",
        label: "becomeDriver.insurance",
        done: Boolean(application.insurance?.photoUrl),
      },
      {
        key: "photo",
        label: "becomeDriver.profilePhoto",
        done: Boolean(application.profilePhotoUrl),
      },
    ];
    const completedCount = sections.filter((s) => s.done).length;
    return { sections, completedCount, total: sections.length };
  }, [application]);
}

/** Part 5 — DRAFT. */
function ContinueApplicationScreen({
  application,
  onResume,
}: {
  application: DriverApplication;
  onResume: () => void;
}) {
  const { t, locale } = useTranslation();
  const { sections, completedCount, total } = useApplicationCompleteness(application);
  const missing = sections.filter((s) => !s.done);
  const progressPercent = (completedCount / total) * 100;
  const lastSavedDate = application.updatedAt.toLocaleDateString(locale, { dateStyle: "medium" });

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <Card className="shadow-elevation1">
        <CardContent className="flex flex-col gap-5 p-8">
          <div>
            <Heading level={2} className="mb-2">
              {t("becomeDriver.continueTitle")}
            </Heading>
            <Text tone="muted">{t("becomeDriver.continueBody")}</Text>
          </div>
          <div className="flex flex-col gap-1.5">
            <Progress value={progressPercent} label={t("becomeDriver.applicationTitle")} />
            <Text size="sm" tone="muted">
              {t("becomeDriver.stepProgress", { current: completedCount, total })}
            </Text>
          </div>
          {missing.length > 0 ? (
            <ChecklistSection
              title={t("becomeDriver.missingInfoHeading")}
              items={missing.map((s) => t(s.label))}
            />
          ) : (
            <Alert tone="success">{t("becomeDriver.missingInfoComplete")}</Alert>
          )}
          <Text size="xs" tone="muted">
            {t("becomeDriver.lastSaved", { date: lastSavedDate })}
          </Text>
          <Button size="lg" fullWidth onClick={onResume}>
            {t("becomeDriver.resumeApplicationCta")}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

const REVIEW_PIPELINE = [
  DriverApplicationStatus.SUBMITTED,
  DriverApplicationStatus.DOCUMENTS_PENDING,
  DriverApplicationStatus.BACKGROUND_CHECK,
  DriverApplicationStatus.VEHICLE_INSPECTION,
  DriverApplicationStatus.INTERVIEW,
  DriverApplicationStatus.APPROVED,
] as const;

const NEXT_STEP_KEY: Partial<Record<DriverApplicationStatus, string>> = {
  [DriverApplicationStatus.SUBMITTED]: "becomeDriver.nextStepSubmitted",
  [DriverApplicationStatus.DOCUMENTS_PENDING]: "becomeDriver.nextStepDocumentsPending",
  [DriverApplicationStatus.BACKGROUND_CHECK]: "becomeDriver.nextStepBackgroundCheck",
  [DriverApplicationStatus.VEHICLE_INSPECTION]: "becomeDriver.nextStepVehicleInspection",
  [DriverApplicationStatus.INTERVIEW]: "becomeDriver.nextStepInterview",
};

/**
 * Part 6/7 — SUBMITTED / DOCUMENTS_PENDING / BACKGROUND_CHECK /
 * VEHICLE_INSPECTION / INTERVIEW. Also stands in for
 * DRIVER_APPLICANT_ACTION_REQUIRED's UI (see that state's doc comment in
 * `@the-ride/types`'s experience.enums.ts for why it can't be reached yet)
 * — an `ACTION_REQUIRED`-shaped Alert renders whenever a future admin note
 * field is present, without requiring a separate screen.
 */
function StatusPortalScreen({ application }: { application: DriverApplication }) {
  const { t, locale } = useTranslation();
  const { sections } = useApplicationCompleteness(application);
  const received = sections.filter((s) => s.done);
  const missing = sections.filter((s) => !s.done);
  const currentIndex = REVIEW_PIPELINE.indexOf(
    application.status as (typeof REVIEW_PIPELINE)[number],
  );
  const nextStepKey = NEXT_STEP_KEY[application.status];

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <Card className="shadow-elevation1">
        <CardContent className="flex flex-col gap-5 p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Heading level={2} className="mb-1">
                {t("becomeDriver.statusPortalTitle")}
              </Heading>
              <Text size="sm" tone="muted">
                {t("becomeDriver.applicationIdLabel")}: {application.id}
              </Text>
            </div>
            <StatusBadge status={application.status} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {REVIEW_PIPELINE.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <Badge tone={index <= currentIndex ? "success" : "neutral"}>
                  {t(DRIVER_APPLICATION_STATUS_LABEL_KEY[step])}
                </Badge>
                {index < REVIEW_PIPELINE.length - 1 && (
                  <span className="text-neutral-300 dark:text-neutral-700">→</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {application.submittedAt && (
              <Text size="sm" tone="muted">
                {t("becomeDriver.submittedDateLabel")}:{" "}
                {application.submittedAt.toLocaleDateString(locale, { dateStyle: "medium" })}
              </Text>
            )}
            <Text size="sm" tone="muted">
              {t("becomeDriver.lastUpdateLabel")}:{" "}
              {application.updatedAt.toLocaleDateString(locale, { dateStyle: "medium" })}
            </Text>
          </div>

          {application.vehicleInfo && (
            <div>
              <Text size="sm" weight="medium" tone="muted">
                {t("becomeDriver.vehicleSummaryHeading")}
              </Text>
              <Text>
                {application.vehicleInfo.make} {application.vehicleInfo.model} (
                {application.vehicleInfo.year}) — {application.vehicleInfo.plateNumber}
              </Text>
            </div>
          )}

          {received.length > 0 && (
            <ChecklistSection
              title={t("becomeDriver.documentsReceivedHeading")}
              items={received.map((s) => t(s.label))}
            />
          )}
          {missing.length > 0 && (
            <ChecklistSection
              title={t("becomeDriver.documentsMissingHeading")}
              items={missing.map((s) => t(s.label))}
            />
          )}

          {nextStepKey && (
            <Alert tone="brand" title={t("becomeDriver.nextStepHeading")}>
              {t(nextStepKey)}
            </Alert>
          )}

          <Button variant="outline" asChild>
            <Link href="/support">{t("becomeDriver.contactSupportCta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

/**
 * Part 9 — APPROVED, not yet activated. Must never expose Go Online /
 * Driver Home here — this screen only renders while there is no `drivers/{uid}`
 * record yet; the moment one exists, `BecomeADriverPage`'s own routing
 * (state-driven, not this component) moves the user to
 * `DriverDashboardScreen` instead. No CTA here can accidentally skip that.
 */
function ApprovedScreen({ application }: { application: DriverApplication }) {
  const { t } = useTranslation();
  const { sections } = useApplicationCompleteness(application);
  const received = sections.filter((s) => s.done);
  const vehicle = application.vehicleInfo;

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <Card className="shadow-elevation1">
        <CardContent className="flex flex-col gap-5 p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <StatusBadge status={application.status} />
            <Heading level={2}>{t("becomeDriver.approvedTitle")}</Heading>
            <Text tone="muted">{t("becomeDriver.approvedBody")}</Text>
          </div>

          {vehicle && (
            <div className="text-left">
              <Text size="sm" weight="medium" tone="muted">
                {t("becomeDriver.approvedVehicleLabel")}
              </Text>
              <Text>
                {vehicle.make} {vehicle.model} ({vehicle.year}) — {vehicle.plateNumber}
              </Text>
            </div>
          )}

          {received.length > 0 && (
            <ChecklistSection
              title={t("becomeDriver.complianceSummaryHeading")}
              items={received.map((s) => t(s.label))}
            />
          )}

          <Alert tone="brand" title={t("becomeDriver.whatHappensNextHeading")}>
            {t("becomeDriver.whatHappensNextBody")}
          </Alert>

          <Button variant="outline" asChild>
            <Link href="/support">{t("becomeDriver.contactSupportCta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

/** REJECTED — not in the sprint's example output list, but a real reachable `DriverApplicationStatus` this page must still handle honestly (Part 24: no missing case). Per UX-2 Part 10: no reapplication action — no business rule/backend support for one exists in this codebase yet (documented as a gap rather than invented). */
function RejectedScreen({ application }: { application: DriverApplication }) {
  const { t, locale } = useTranslation();
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 text-center">
      <Card className="shadow-elevation1">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <StatusBadge status={application.status} />
          <Heading level={2}>{t("becomeDriver.rejectedTitle")}</Heading>
          <Text tone="muted">{t("becomeDriver.rejectedBody")}</Text>
          <Text size="sm" tone="muted">
            {t("becomeDriver.decisionDateLabel")}:{" "}
            {application.updatedAt.toLocaleDateString(locale, { dateStyle: "medium" })}
          </Text>
          {application.rejectionReason && (
            <Alert
              tone="neutral"
              title={t("becomeDriver.rejectionReasonLabel")}
              className="w-full text-left"
            >
              {application.rejectionReason}
            </Alert>
          )}
          <Button variant="outline" asChild>
            <Link href="/support">{t("becomeDriver.contactSupportCta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function ApplicationWizard({
  userId,
  existingApplication,
}: {
  userId: string;
  existingApplication: DriverApplication | null;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { refresh: refreshExperience } = useUserExperience();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoBusy, setPhotoBusy] = useState(false);
  const savingRef = useRef(false);
  const licenseUploadAttempt = useRef(0);
  const insuranceUploadAttempt = useRef(0);
  const profileUploadAttempt = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        // Trusts the caller's already-resolved application (from
        // `useUserExperience()`, gated on its own fetch error — see
        // `BecomeADriverPage`) instead of independently re-querying
        // Firestore here. Two separate reads of "does an application
        // already exist" could disagree (e.g. an unordered query
        // non-deterministically picking a different doc) and that
        // disagreement is exactly what could let this fall through to
        // `createDraftApplication` and create a duplicate (Micro-Sprint A:
        // "duplicate application cannot be created").
        if (existingApplication) {
          if (existingApplication.status === DriverApplicationStatus.SUBMITTED) {
            setSubmitted(true);
          }
          setApplicationId(existingApplication.id);
          setForm(fromApplication(existingApplication));
          setStepIndex(firstIncompleteStepIndex(existingApplication));
        } else {
          const id = await createDraftApplication(webFirestore, userId);
          if (!cancelled) setApplicationId(id);
        }
      } catch (err) {
        // The raw Zod issue text (e.g. "createdAt: Expected date, received
        // object") is developer-facing, not user-facing — log it in full for
        // debugging but show a friendly, translated message instead.
        console.error("[become-a-driver] failed to load application", err);
        if (!cancelled)
          setLoadError(
            err instanceof ZodError
              ? t("becomeDriver.loadErrorBody")
              : err instanceof Error
                ? err.message
                : String(err),
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, existingApplication, loadAttempt]);

  const step: StepKey = STEP_KEYS[stepIndex]!;
  const progress = useMemo(() => ((stepIndex + 1) / STEP_KEYS.length) * 100, [stepIndex]);

  function validateStep(): boolean {
    const nextErrors: Record<string, string> = {};
    if (step === "personal") {
      for (const key of [
        "firstName",
        "lastName",
        "phoneNumber",
        "dateOfBirth",
        "address",
        "city",
      ] as const) {
        if (!form.personalInfo[key].trim()) nextErrors[key] = t("common.required");
      }
    } else if (step === "license") {
      for (const key of ["licenseNumber", "licenseState", "licenseExpiresAt"] as const) {
        if (!form.license[key]?.trim()) nextErrors[key] = t("common.required");
      }
    } else if (step === "vehicle") {
      for (const key of ["make", "model", "year", "color", "plateNumber"] as const) {
        if (!form.vehicleInfo[key].trim()) nextErrors[key] = t("common.required");
      }
    } else if (step === "insurance") {
      for (const key of ["provider", "policyNumber", "expiresAt"] as const) {
        if (!form.insurance[key]?.trim()) nextErrors[key] = t("common.required");
      }
    } else if (step === "photo") {
      if (!form.profilePhotoUrl) nextErrors.profilePhoto = t("becomeDriver.photoRequired");
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function persistCurrentStep() {
    if (!applicationId) return;
    if (step === "personal")
      await saveApplicationProgress(webFirestore, applicationId, {
        personalInfo: form.personalInfo,
      });
    else if (step === "license")
      await saveApplicationProgress(webFirestore, applicationId, { license: form.license });
    else if (step === "vehicle")
      await saveApplicationProgress(webFirestore, applicationId, {
        vehicleInfo: { ...form.vehicleInfo, year: Number(form.vehicleInfo.year) },
      });
    else if (step === "insurance")
      await saveApplicationProgress(webFirestore, applicationId, { insurance: form.insurance });
    else if (step === "photo" && form.profilePhotoUrl)
      await saveApplicationProgress(webFirestore, applicationId, {
        profilePhotoUrl: form.profilePhotoUrl,
      });
  }

  async function handleNext() {
    if (savingRef.current) return;
    if (!validateStep()) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await persistCurrentStep();
      setStepIndex((current) => Math.min(current + 1, STEP_KEYS.length - 1));
    } catch (err) {
      console.error("[become-a-driver] failed to save step", step, err);
      toast({ variant: "danger", title: describeSaveError(err, t) });
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  function handleBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    if (!applicationId || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await submitApplication(webFirestore, applicationId);
      setSubmitted(true);
      // FUNCTIONAL-STABILIZATION — `useUserExperience()`'s shared context is
      // the single source every "Become a Driver" entry point (sidebar,
      // header CTA, this page's own status branch) reads from; without this,
      // a real Firestore write to `status: submitted` had happened, but the
      // cached `currentApplication` everywhere else on the site still read
      // `draft` until a full page reload — the sidebar kept offering
      // "Continue Application," and revisiting this URL would route back
      // into `ContinueApplicationScreen` instead of the submitted status
      // view. `refresh()` is documented for exactly this ("call after an
      // action that changes lifecycle stage") but wasn't actually wired here.
      refreshExperience();
      toast({ variant: "success", title: t("becomeDriver.applicationSubmitted") });
    } catch (err) {
      console.error("[become-a-driver] failed to submit application", err);
      toast({ variant: "danger", title: describeSaveError(err, t) });
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  async function handleLicensePhoto(file: File) {
    if (!applicationId) return;
    const attempt = ++licenseUploadAttempt.current;
    try {
      const url = await withTimeout(
        uploadDriverDocument(userId, "drivers_license", file),
        UPLOAD_TIMEOUT_MS,
      );
      if (licenseUploadAttempt.current !== attempt) return; // superseded by a retry — ignore this stale result
      setForm((current) => ({ ...current, license: { ...current.license, photoUrl: url } }));
      await saveApplicationProgress(webFirestore, applicationId, {
        license: { ...form.license, photoUrl: url },
      });
      toast({ variant: "success", title: t("becomeDriver.uploaded") });
    } catch (err) {
      if (licenseUploadAttempt.current !== attempt) return;
      console.error("[become-a-driver] failed to upload license photo", err);
      const message = describeUploadError(err, t);
      toast({ variant: "danger", title: message });
      throw new Error(message);
    }
  }

  async function handleInsurancePhoto(file: File) {
    if (!applicationId) return;
    const attempt = ++insuranceUploadAttempt.current;
    try {
      const url = await withTimeout(
        uploadDriverDocument(userId, "vehicle_insurance", file),
        UPLOAD_TIMEOUT_MS,
      );
      if (insuranceUploadAttempt.current !== attempt) return;
      setForm((current) => ({ ...current, insurance: { ...current.insurance, photoUrl: url } }));
      await saveApplicationProgress(webFirestore, applicationId, {
        insurance: { ...form.insurance, photoUrl: url },
      });
      toast({ variant: "success", title: t("becomeDriver.uploaded") });
    } catch (err) {
      if (insuranceUploadAttempt.current !== attempt) return;
      console.error("[become-a-driver] failed to upload insurance photo", err);
      const message = describeUploadError(err, t);
      toast({ variant: "danger", title: message });
      throw new Error(message);
    }
  }

  async function handleProfilePhoto(file: File) {
    if (!applicationId) return;
    const attempt = ++profileUploadAttempt.current;
    try {
      const url = await withTimeout(uploadDriverProfilePhoto(userId, file), UPLOAD_TIMEOUT_MS);
      if (profileUploadAttempt.current !== attempt) return;
      setForm((current) => ({ ...current, profilePhotoUrl: url }));
      await saveApplicationProgress(webFirestore, applicationId, { profilePhotoUrl: url });
      toast({ variant: "success", title: t("becomeDriver.uploaded") });
    } catch (err) {
      if (profileUploadAttempt.current !== attempt) return;
      console.error("[become-a-driver] failed to upload profile photo", err);
      const message = describeUploadError(err, t);
      toast({ variant: "danger", title: message });
      throw new Error(message);
    }
  }

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ErrorState
          title={t("becomeDriver.loadErrorTitle")}
          description={loadError}
          action={<Button onClick={() => setLoadAttempt((n) => n + 1)}>{t("common.retry")}</Button>}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  if (submitted) {
    return (
      <section className="mx-auto max-w-xl px-6 py-16 text-center">
        <Heading level={1} className="mb-4">
          {t("becomeDriver.applicationSubmitted")}
        </Heading>
        <Text size="lg" tone="muted" className="mb-8">
          {t("becomeDriver.applicationSubmittedBody")}
        </Text>
        <Button asChild>
          <Link href="/profile">{t("profile.title")}</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <Heading level={1} className="mb-2">
        {t("becomeDriver.applicationTitle")}
      </Heading>
      <Text tone="muted" className="mb-6">
        {t("becomeDriver.applicationSubtitle")}
      </Text>
      <Progress value={progress} label={t("becomeDriver.applicationTitle")} className="mb-2" />
      <Text size="sm" tone="muted" className="mb-8">
        {t("becomeDriver.stepProgress", { current: stepIndex + 1, total: STEP_KEYS.length })}
      </Text>

      <Card>
        <CardContent className="p-8">
          {step === "personal" && (
            <StepFields title={t("becomeDriver.stepPersonal")}>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t("auth.firstNameLabel")}
                  value={form.personalInfo.firstName}
                  errorText={errors.firstName}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      personalInfo: { ...c.personalInfo, firstName: e.target.value },
                    }))
                  }
                />
                <Input
                  label={t("auth.lastNameLabel")}
                  value={form.personalInfo.lastName}
                  errorText={errors.lastName}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      personalInfo: { ...c.personalInfo, lastName: e.target.value },
                    }))
                  }
                />
              </div>
              <Input
                label={t("auth.phoneLabel")}
                value={form.personalInfo.phoneNumber}
                errorText={errors.phoneNumber}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    personalInfo: { ...c.personalInfo, phoneNumber: e.target.value },
                  }))
                }
              />
              <Input
                label={t("becomeDriver.dateOfBirth")}
                type="date"
                value={form.personalInfo.dateOfBirth}
                errorText={errors.dateOfBirth}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    personalInfo: { ...c.personalInfo, dateOfBirth: e.target.value },
                  }))
                }
              />
              <Input
                label={t("becomeDriver.address")}
                value={form.personalInfo.address}
                errorText={errors.address}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    personalInfo: { ...c.personalInfo, address: e.target.value },
                  }))
                }
              />
              <Input
                label={t("becomeDriver.city")}
                value={form.personalInfo.city}
                errorText={errors.city}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    personalInfo: { ...c.personalInfo, city: e.target.value },
                  }))
                }
              />
            </StepFields>
          )}

          {step === "license" && (
            <StepFields title={t("becomeDriver.license")}>
              <Input
                label={t("becomeDriver.licenseNumber")}
                value={form.license.licenseNumber}
                errorText={errors.licenseNumber}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    license: { ...c.license, licenseNumber: e.target.value },
                  }))
                }
              />
              <Input
                label={t("becomeDriver.licenseState")}
                value={form.license.licenseState}
                errorText={errors.licenseState}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    license: { ...c.license, licenseState: e.target.value },
                  }))
                }
              />
              <Input
                label={t("becomeDriver.licenseExpiresAt")}
                type="date"
                value={form.license.licenseExpiresAt}
                errorText={errors.licenseExpiresAt}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    license: { ...c.license, licenseExpiresAt: e.target.value },
                  }))
                }
              />
              <PhotoField
                label={t("becomeDriver.uploadLicensePhoto")}
                uploadedUrl={form.license.photoUrl}
                onSelect={handleLicensePhoto}
                onBusyChange={setPhotoBusy}
              />
            </StepFields>
          )}

          {step === "vehicle" && (
            <StepFields title={t("becomeDriver.vehicle")}>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t("becomeDriver.vehicleMake")}
                  value={form.vehicleInfo.make}
                  errorText={errors.make}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      vehicleInfo: { ...c.vehicleInfo, make: e.target.value },
                    }))
                  }
                />
                <Input
                  label={t("becomeDriver.vehicleModel")}
                  value={form.vehicleInfo.model}
                  errorText={errors.model}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      vehicleInfo: { ...c.vehicleInfo, model: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t("becomeDriver.vehicleYear")}
                  type="number"
                  value={form.vehicleInfo.year}
                  errorText={errors.year}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      vehicleInfo: { ...c.vehicleInfo, year: e.target.value },
                    }))
                  }
                />
                <Input
                  label={t("becomeDriver.vehicleColor")}
                  value={form.vehicleInfo.color}
                  errorText={errors.color}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      vehicleInfo: { ...c.vehicleInfo, color: e.target.value },
                    }))
                  }
                />
              </div>
              <Input
                label={t("becomeDriver.vehiclePlate")}
                value={form.vehicleInfo.plateNumber}
                errorText={errors.plateNumber}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    vehicleInfo: { ...c.vehicleInfo, plateNumber: e.target.value },
                  }))
                }
              />
            </StepFields>
          )}

          {step === "insurance" && (
            <StepFields title={t("becomeDriver.insurance")}>
              <Input
                label={t("becomeDriver.insuranceProvider")}
                value={form.insurance.provider}
                errorText={errors.provider}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    insurance: { ...c.insurance, provider: e.target.value },
                  }))
                }
              />
              <Input
                label={t("becomeDriver.policyNumber")}
                value={form.insurance.policyNumber}
                errorText={errors.policyNumber}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    insurance: { ...c.insurance, policyNumber: e.target.value },
                  }))
                }
              />
              <Input
                label={t("becomeDriver.insuranceExpiresAt")}
                type="date"
                value={form.insurance.expiresAt}
                errorText={errors.expiresAt}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    insurance: { ...c.insurance, expiresAt: e.target.value },
                  }))
                }
              />
              <PhotoField
                label={t("becomeDriver.uploadInsurancePhoto")}
                uploadedUrl={form.insurance.photoUrl}
                onSelect={handleInsurancePhoto}
                onBusyChange={setPhotoBusy}
              />
            </StepFields>
          )}

          {step === "photo" && (
            <StepFields title={t("becomeDriver.profilePhoto")}>
              <PhotoField
                label={t("becomeDriver.uploadProfilePhoto")}
                uploadedUrl={form.profilePhotoUrl}
                onSelect={handleProfilePhoto}
                onBusyChange={setPhotoBusy}
              />
              {errors.profilePhoto && (
                <Text size="sm" tone="danger">
                  {errors.profilePhoto}
                </Text>
              )}
            </StepFields>
          )}

          {step === "review" && (
            <StepFields title={t("becomeDriver.review")}>
              <ReviewRow
                label={t("auth.fullNameLabel")}
                value={`${form.personalInfo.firstName} ${form.personalInfo.lastName}`}
              />
              <ReviewRow label={t("auth.phoneLabel")} value={form.personalInfo.phoneNumber} />
              <ReviewRow
                label={t("becomeDriver.licenseNumber")}
                value={form.license.licenseNumber}
              />
              <ReviewRow
                label={t("becomeDriver.vehicle")}
                value={`${form.vehicleInfo.make} ${form.vehicleInfo.model} (${form.vehicleInfo.year})`}
              />
              <ReviewRow
                label={t("becomeDriver.insuranceProvider")}
                value={form.insurance.provider}
              />
              <ReviewRow
                label={t("becomeDriver.profilePhoto")}
                value={form.profilePhotoUrl ? t("becomeDriver.uploaded") : t("common.no")}
              />
            </StepFields>
          )}

          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={stepIndex === 0}>
              {t("common.back")}
            </Button>
            {step === "review" ? (
              <Button onClick={() => void handleSubmit()} isLoading={saving}>
                {t("becomeDriver.submitApplication")}
              </Button>
            ) : (
              <Button onClick={() => void handleNext()} isLoading={saving} disabled={photoBusy}>
                {t("common.next")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function StepFields({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <Heading level={3}>{title}</Heading>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-neutral-100 py-2 dark:border-neutral-800">
      <Text tone="muted" size="sm">
        {label}
      </Text>
      <Text size="sm" weight="medium">
        {value || "—"}
      </Text>
    </div>
  );
}

function PhotoField({
  label,
  uploadedUrl,
  onSelect,
  onBusyChange,
}: {
  label: string;
  uploadedUrl?: string;
  onSelect: (file: File) => Promise<void>;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UploadStatus>(uploadedUrl ? "success" : "idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const busyRef = useRef(false);

  async function processFile(file: File) {
    if (busyRef.current) return; // in-flight guard — ignore re-entrant selects/retries
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setStatus("error");
      setErrorMessage(t("becomeDriver.uploadInvalidType"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setStatus("error");
      setErrorMessage(t("becomeDriver.uploadTooLarge"));
      return;
    }
    busyRef.current = true;
    onBusyChange?.(true);
    setStatus("uploading");
    setErrorMessage(null);
    setLastFile(file);
    try {
      await onSelect(file);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : t("becomeDriver.uploadFailed"));
    } finally {
      busyRef.current = false;
      onBusyChange?.(false);
    }
  }

  function handleChange(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = ""; // let the same file be re-selected after a failure
    if (!file) return;
    void processFile(file);
  }

  function handleRetry() {
    if (lastFile) void processFile(lastFile);
  }

  const isUploading = status === "uploading";

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-2 overflow-x-hidden">
      <Text size="sm" weight="medium">
        {label}
      </Text>
      <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-1">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          disabled={isUploading}
          className="min-w-0 max-w-full flex-shrink text-sm disabled:opacity-50"
          aria-label={label}
        />
        {isUploading && (
          <Text size="sm" className="min-w-0 break-words">
            {t("becomeDriver.uploading")}
          </Text>
        )}
        {status === "success" && !isUploading && (
          <Text size="sm" tone="success" className="min-w-0 break-words">
            {t("becomeDriver.uploaded")}
          </Text>
        )}
      </div>
      {status === "error" && errorMessage && (
        <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-2">
          <Text size="sm" tone="danger" className="min-w-0 break-words">
            {errorMessage}
          </Text>
          {lastFile && (
            <Button type="button" size="sm" variant="outline" onClick={handleRetry}>
              {t("common.retry")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
