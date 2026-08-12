"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { useTableState } from "@/lib/useTableState";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Illustration,
  LoadingState,
  Pagination,
  Select,
  SearchBar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  useTranslation,
} from "@the-ride/ui";
import {
  DriverApplicationStatus,
  driverApplicationSchema,
  type DriverApplication,
} from "@the-ride/types";
import { getDocumentComplianceSummary } from "@the-ride/utils";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

const PENDING_STATUSES = [
  DriverApplicationStatus.SUBMITTED,
  DriverApplicationStatus.DOCUMENTS_PENDING,
  DriverApplicationStatus.BACKGROUND_CHECK,
  DriverApplicationStatus.VEHICLE_INSPECTION,
  DriverApplicationStatus.INTERVIEW,
  DriverApplicationStatus.APPROVED,
];

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  submitted: "neutral",
  documents_pending: "brand",
  background_check: "brand",
  vehicle_inspection: "brand",
  interview: "brand",
  approved: "success",
  rejected: "danger",
};

const COMPLIANCE_TONE: Record<string, "success" | "warning" | "neutral"> = {
  complete: "success",
  issues: "warning",
  pending: "neutral",
};

/** A row's applicant name is nested under `personalInfo` — `useTableState`'s search only matches top-level fields, so this precomputes one flat string search/sort can use directly (Part 25). */
type SearchableApplication = DriverApplication & { applicantName: string };

interface ApplicationsTabProps {
  onView: (applicationId: string) => void;
}

/**
 * Admin Driver Application Review Workspace sprint, Part 2/17 — this table
 * is a summary list only now. Every consequential action (advance,
 * reject, activate, document review) moved into
 * `ApplicationReviewWorkspace`, opened via "View Application" — no more
 * blind Advance/Reject buttons in a table row (and no more the duplicate,
 * mislabeled "Advance" button that used to silently reject an application
 * with no reason — see `getApplicationActions`'s doc comment in
 * `apps/admin/src/lib/driver-admin.ts`).
 */
export function ApplicationsTab({ onView }: ApplicationsTabProps) {
  const { t, locale } = useTranslation();
  const [applications, setApplications] = useState<DriverApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(adminFirestore, "driverApplications"),
      where("status", "in", PENDING_STATUSES),
      orderBy("submittedAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const parsed: DriverApplication[] = [];
        for (const d of snapshot.docs) {
          try {
            parsed.push(driverApplicationSchema.parse({ id: d.id, ...d.data() }));
          } catch (err) {
            // One malformed/in-flight doc (e.g. a serverTimestamp field not
            // yet acked by the server) must not blank the whole table —
            // skip it for this snapshot; the next snapshot picks it up
            // once valid. See driver-admin.ts's serverTimestamp doc
            // comments for why fields here are client Dates, not this.
            console.error("[ApplicationsTab] failed to parse application", d.id, err);
          }
        }
        setApplications(parsed);
      },
      (err) =>
        setError(
          err.message.includes("permission")
            ? t("admin.documentReview.permissionDenied")
            : err.message,
        ),
    );
    return unsubscribe;
  }, [t]);

  const searchableApplications: SearchableApplication[] = (applications ?? []).map(
    (application) => ({
      ...application,
      applicantName: application.personalInfo
        ? `${application.personalInfo.firstName} ${application.personalInfo.lastName}`
        : application.userId,
    }),
  );

  const table = useTableState({
    data: searchableApplications,
    searchFields: ["applicantName", "status"],
    pageSize: 10,
  });

  if (error) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />;
  }

  if (applications === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <SearchBar
          label={t("common.search")}
          placeholder={t("admin.documentReview.searchApplicantPlaceholder")}
          value={table.search}
          onChange={(e) => table.setSearch(e.target.value)}
        />
        <Select
          label={t("admin.drivers.status")}
          placeholder={t("admin.table.allStatuses")}
          value={table.filters.status ?? ""}
          onValueChange={(value) => table.setFilter("status", value)}
          options={PENDING_STATUSES.map((status) => ({
            value: status,
            label: t(`becomeDriver.status${toPascal(status)}`),
          }))}
        />
        <Button variant="outline" onClick={table.clearFilters}>
          {t("admin.table.clearFilters")}
        </Button>
      </div>

      {table.totalCount === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("admin.drivers.noApplications")}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.drivers.applicant")}</TableHead>
                <TableHead>{t("admin.documentReview.submittedDate")}</TableHead>
                <TableHead>{t("admin.drivers.status")}</TableHead>
                <TableHead>{t("admin.documentReview.vehicleColumn")}</TableHead>
                <TableHead>{t("admin.documentReview.complianceStatus")}</TableHead>
                <TableHead>{t("admin.drivers.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageItems.map((application) => {
                const compliance = getDocumentComplianceSummary(application.documentReviews);
                return (
                  <TableRow key={application.id}>
                    <TableCell>{application.applicantName}</TableCell>
                    <TableCell>
                      <Text size="sm" tone="muted">
                        {application.submittedAt
                          ? application.submittedAt.toLocaleDateString(locale, {
                              dateStyle: "medium",
                            })
                          : "—"}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Badge tone={STATUS_TONE[application.status] ?? "neutral"}>
                        {t(`becomeDriver.status${toPascal(application.status)}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Text size="sm" tone="muted">
                        {application.vehicleInfo
                          ? `${application.vehicleInfo.make} ${application.vehicleInfo.model}`
                          : "—"}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Badge tone={COMPLIANCE_TONE[compliance]}>
                        {t(`admin.documentReview.compliance.${compliance}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => onView(application.id)}>
                        {t("admin.documentReview.viewApplication")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination
            page={table.page}
            pageCount={table.pageCount}
            onPageChange={table.setPage}
            previousLabel={t("common.previous")}
            nextLabel={t("common.next")}
            summary={t("admin.table.pageSummary", { current: table.page, total: table.pageCount })}
          />
        </>
      )}
    </div>
  );
}

function toPascal(value: string): string {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join("");
}
