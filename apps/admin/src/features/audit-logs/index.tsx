"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { exportToCsv } from "@/lib/csv";
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
  useTranslation,
} from "@the-ride/ui";
import type { AuditLog } from "@the-ride/types";
import { collection, limit as fsLimit, onSnapshot, orderBy, query } from "firebase/firestore";
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

/**
 * Audit Logs (Web Phase W1, Parts 5-6) — read-only live view of
 * `auditLogs`, written exclusively server-side (Admin SDK). Every client,
 * admin included, has `allow write: if false` on this collection per
 * `firestore.rules` — so unlike Drivers/Passengers/Vehicle Categories,
 * there is no admin-dashboard mutation path here by design.
 */
export function AuditLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(adminFirestore, "auditLogs"),
      orderBy("createdAt", "desc"),
      fsLimit(500),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => setLogs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog)),
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  const table = useTableState({
    data: logs ?? [],
    searchFields: ["action", "actorId", "targetId", "targetType"],
    pageSize: 20,
  });

  function handleExport() {
    exportToCsv(
      "audit-logs",
      table.pageItems.map((log) => ({
        id: log.id,
        action: log.action,
        actorId: log.actorId,
        actorRole: log.actorRole,
        targetId: log.targetId ?? "",
        targetType: log.targetType ?? "",
      })),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.auditLogs.title")}</Heading>

      {error ? (
        <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />
      ) : logs === null ? (
        <LoadingState title={t("common.loading")} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <SearchBar
              label={t("common.search")}
              placeholder={t("common.searchPlaceholder")}
              value={table.search}
              onChange={(e) => table.setSearch(e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={table.pageItems.length === 0}
            >
              {t("admin.table.exportCsv")}
            </Button>
          </div>

          {table.totalCount === 0 ? (
            <EmptyState
              icon={<Illustration name="empty" size={80} />}
              title={t("admin.auditLogs.noLogs")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.auditLogs.action")}</TableHead>
                    <TableHead>{t("admin.auditLogs.actor")}</TableHead>
                    <TableHead>{t("admin.auditLogs.target")}</TableHead>
                    <TableHead>{t("admin.auditLogs.when")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.pageItems.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge tone="neutral">{log.action}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.actorId}{" "}
                        <span className="text-neutral-500 dark:text-neutral-400">
                          ({log.actorRole})
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.targetId ? `${log.targetType ?? ""} ${log.targetId}` : "—"}
                      </TableCell>
                      <TableCell>{formatDate(log.createdAt)}</TableCell>
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
                summary={t("admin.table.pageSummary", {
                  current: table.page,
                  total: table.pageCount,
                })}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
