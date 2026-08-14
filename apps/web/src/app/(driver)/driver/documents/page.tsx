"use client";

import { useUserExperience } from "@/hooks/useUserExperience";
import {
  Alert,
  Badge,
  Card,
  CardContent,
  EmptyState,
  Heading,
  Illustration,
  LoadingState,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { DriverDocumentType, type DriverDocument } from "@the-ride/types";
import {
  getDaysUntilExpiration,
  getDocumentExpirationStatus,
  type DocumentExpirationStatus,
} from "@the-ride/utils";

const DOCUMENT_LABEL_KEY: Record<DriverDocumentType, string> = {
  [DriverDocumentType.DRIVERS_LICENSE]: "admin.documentReview.documentLicense",
  [DriverDocumentType.VEHICLE_INSURANCE]: "admin.documentReview.documentInsurance",
  [DriverDocumentType.VEHICLE_REGISTRATION]: "admin.documentReview.documentRegistration",
  [DriverDocumentType.BACKGROUND_CHECK]: "admin.documentReview.documentBackgroundCheck",
  [DriverDocumentType.PROFILE_PHOTO]: "admin.documentReview.documentProfilePhoto",
};

const EXPIRATION_TONE: Record<
  DocumentExpirationStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  valid: "success",
  expiring_soon: "warning",
  expired: "danger",
  no_expiration: "neutral",
};

const EXPIRATION_LABEL_KEY: Record<DocumentExpirationStatus, string> = {
  valid: "driverSpace.documents.statusValid",
  expiring_soon: "driverSpace.documents.statusExpiringSoon",
  expired: "driverSpace.documents.statusExpired",
  no_expiration: "driverSpace.documents.statusNoExpiration",
};

/**
 * UX-3 sprint (Dedicated Driver Space), Parts 11-12 — the driver's real
 * `drivers/{uid}.documents` array, the exact data `getOnlineEligibility`
 * (and, server-side, `DispatchService.buildMatchingCandidates`) already
 * gates dispatch eligibility on. Read-only: `firestore.rules`'s
 * `drivers/{driverId}` write is `isAdmin()`-only, so a self-service
 * replace/upload flow has no path to actually update this record even
 * though Storage itself would accept the file — disclosed below rather
 * than built as a button that silently can't finish its job.
 */
export default function DriverDocumentsPage() {
  const { t, locale } = useTranslation();
  const { driver } = useUserExperience();

  if (!driver) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Heading level={1}>{t("driverSpace.nav.documents")}</Heading>

      {driver.documents.length === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("driverSpace.documents.emptyTitle")}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {driver.documents.map((document) => (
            <DocumentCard key={document.type} document={document} locale={locale} t={t} />
          ))}
        </div>
      )}

      <Alert tone="neutral" title={t("driverSpace.documents.replaceGapTitle")}>
        {t("driverSpace.documents.replaceGapBody")}
      </Alert>
    </div>
  );
}

function DocumentCard({
  document,
  locale,
  t,
}: {
  document: DriverDocument;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const status = getDocumentExpirationStatus(document.expiresAt);
  const daysUntil = document.expiresAt ? getDaysUntilExpiration(document.expiresAt) : undefined;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-6">
        <div className="flex items-center justify-between">
          <Text weight="medium">{t(DOCUMENT_LABEL_KEY[document.type])}</Text>
          <Badge tone={EXPIRATION_TONE[status]}>{t(EXPIRATION_LABEL_KEY[status])}</Badge>
        </div>
        {document.expiresAt && (
          <Text size="sm" tone="muted">
            {status === "expired"
              ? t("driverSpace.documents.expiredOn", {
                  date: document.expiresAt.toLocaleDateString(locale, { dateStyle: "medium" }),
                })
              : t("driverSpace.documents.expiresIn", { days: daysUntil ?? 0 })}
          </Text>
        )}
        {document.verifiedAt && (
          <Text size="xs" tone="muted">
            {t("driverSpace.documents.verifiedOn", {
              date: document.verifiedAt.toLocaleDateString(locale, { dateStyle: "medium" }),
            })}
          </Text>
        )}
        <img
          src={document.url}
          alt={t(DOCUMENT_LABEL_KEY[document.type])}
          className="max-h-48 w-full rounded-lg border border-neutral-200 object-cover dark:border-neutral-800"
        />
      </CardContent>
    </Card>
  );
}
