"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { dismissReport, resolveReport } from "@/lib/report-admin";
import { useTableState } from "@/lib/useTableState";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Heading,
  Illustration,
  LoadingState,
  Pagination,
  SearchBar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import { ReportStatus, type Report } from "@the-ride/types";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  open: "warning",
  under_review: "brand",
  resolved: "success",
  dismissed: "neutral",
};

/**
 * Reports (Web Phase W1, Parts 5-6) — live Firestore-backed list of
 * user-submitted incident reports with resolve/dismiss actions,
 * replacing the earlier `PlaceholderDashboardPage`.
 */
export function ReportsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { session } = useAuth();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(adminFirestore, "reports"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => setReports(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Report)),
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  const table = useTableState({
    data: reports ?? [],
    searchFields: ["reporterId", "targetId", "category", "description"],
    pageSize: 10,
  });

  async function handleResolve(report: Report) {
    setBusyId(report.id);
    try {
      await resolveReport(adminFirestore, report.id, session?.uid ?? "");
      toast({ variant: "success", title: t("admin.reportsPage.resolved") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDismiss(report: Report) {
    setBusyId(report.id);
    try {
      await dismissReport(adminFirestore, report.id, session?.uid ?? "");
      toast({ variant: "success", title: t("admin.reportsPage.dismissed") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />;
  }

  if (reports === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.reports")}</Heading>

      <SearchBar
        label={t("common.search")}
        placeholder={t("common.searchPlaceholder")}
        value={table.search}
        onChange={(e) => table.setSearch(e.target.value)}
      />

      {table.totalCount === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("admin.reportsPage.noReports")}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.reportsPage.reporter")}</TableHead>
                <TableHead>{t("admin.reportsPage.target")}</TableHead>
                <TableHead>{t("admin.reportsPage.category")}</TableHead>
                <TableHead>{t("admin.reportsPage.detail")}</TableHead>
                <TableHead>{t("admin.reportsPage.status")}</TableHead>
                <TableHead>{t("admin.reportsPage.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageItems.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.reporterId}</TableCell>
                  <TableCell>
                    {report.targetType} {report.targetId}
                  </TableCell>
                  <TableCell>{t(`admin.reportCategory.${report.category}`)}</TableCell>
                  <TableCell className="max-w-xs truncate">{report.description}</TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[report.status] ?? "neutral"}>
                      {t(`admin.reportStatus.${report.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {report.status !== ReportStatus.RESOLVED &&
                      report.status !== ReportStatus.DISMISSED && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={busyId === report.id}
                            onClick={() => void handleResolve(report)}
                          >
                            {t("admin.reportsPage.resolve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={busyId === report.id}
                            onClick={() => void handleDismiss(report)}
                          >
                            {t("admin.reportsPage.dismiss")}
                          </Button>
                        </div>
                      )}
                  </TableCell>
                </TableRow>
              ))}
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
