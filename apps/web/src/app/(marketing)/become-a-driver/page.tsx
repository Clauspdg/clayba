"use client";

import {
  uploadDriverDocument,
  uploadDriverProfilePhoto,
  createDraftApplication,
  findOwnApplication,
  saveApplicationProgress,
  submitApplication,
} from "@the-ride/firebase/client";
import {
  Button,
  Card,
  CardContent,
  ErrorState,
  Heading,
  Input,
  LoadingState,
  Progress,
  Text,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import type { DriverApplication } from "@the-ride/types";
import { FirebaseError } from "firebase/app";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ZodError } from "zod";

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

export default function BecomeADriverPage() {
  const { t } = useTranslation();
  const { status, session } = useAuth();

  if (status === "loading") {
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

  return <ApplicationWizard userId={session.uid} />;
}

function ApplicationWizard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();
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
        const existing = await findOwnApplication(webFirestore, userId);
        if (cancelled) return;
        if (existing) {
          if (existing.status === "submitted") {
            setSubmitted(true);
          }
          setApplicationId(existing.id);
          setForm(fromApplication(existing));
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
  }, [userId, loadAttempt]);

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
