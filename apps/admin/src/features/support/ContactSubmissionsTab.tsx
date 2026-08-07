"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { markContactSubmissionRead } from "@/lib/support-admin";
import { useTableState } from "@/lib/useTableState";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
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
import type { ContactSubmission } from "@the-ride/types";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

function formatDate(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toLocaleString();
  }
  if (value instanceof Date) return value.toLocaleString();
  return "—";
}

export function ContactSubmissionsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<ContactSubmission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ContactSubmission | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(adminFirestore, "contactSubmissions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) =>
        setSubmissions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ContactSubmission)),
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  const table = useTableState({
    data: submissions ?? [],
    searchFields: ["name", "email", "message"],
    pageSize: 10,
  });

  async function handleView(submission: ContactSubmission) {
    setViewing(submission);
    if (submission.status === "new") {
      setBusyId(submission.id);
      try {
        await markContactSubmissionRead(adminFirestore, submission.id);
      } catch (err) {
        toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
      } finally {
        setBusyId(null);
      }
    }
  }

  if (error) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />;
  }

  if (submissions === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        label={t("common.search")}
        placeholder={t("common.searchPlaceholder")}
        value={table.search}
        onChange={(e) => table.setSearch(e.target.value)}
      />

      {table.totalCount === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("admin.support.noContactSubmissions")}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.support.from")}</TableHead>
                <TableHead>{t("admin.support.received")}</TableHead>
                <TableHead>{t("admin.support.status")}</TableHead>
                <TableHead>{t("admin.support.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageItems.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-neutral-900 dark:text-neutral-50">
                        {submission.name}
                      </span>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        {submission.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(submission.createdAt)}</TableCell>
                  <TableCell>
                    <Badge tone={submission.status === "new" ? "brand" : "neutral"}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={busyId === submission.id}
                      onClick={() => void handleView(submission)}
                    >
                      {t("admin.support.viewMessage")}
                    </Button>
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

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
            {viewing?.message}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
