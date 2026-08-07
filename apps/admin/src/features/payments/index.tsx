"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { exportToCsv } from "@/lib/csv";
import { useTableState } from "@/lib/useTableState";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import type { Payment } from "@the-ride/types";
import { collection, limit as fsLimit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  pending: "neutral",
  authorized: "brand",
  captured: "success",
  failed: "danger",
  refunded: "warning",
};

/**
 * Payments (Web Phase W1, Parts 5-6) — live, read-only Firestore list from
 * `payments`. Deliberately no mutation actions: `firestore.rules` allows
 * admin writes, but capturing/refunding a real charge requires a real
 * payment gateway (Stripe/etc.), which isn't integrated in this
 * environment — a client-side status edit here would misrepresent money
 * that never actually moved.
 */
export function PaymentsPage() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(adminFirestore, "payments"),
      orderBy("createdAt", "desc"),
      fsLimit(500),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => setPayments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment)),
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  const table = useTableState({
    data: payments ?? [],
    searchFields: ["id", "tripId", "payerId"],
    pageSize: 10,
  });

  function handleExport() {
    exportToCsv(
      "payments",
      table.pageItems.map((payment) => ({
        id: payment.id,
        tripId: payment.tripId,
        payerId: payment.payerId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
      })),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.payments")}</Heading>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.paymentsPage.title")}</CardTitle>
          <CardDescription>{t("admin.paymentsPage.description")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6">
              <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />
            </div>
          ) : payments === null ? (
            <div className="p-6">
              <LoadingState title={t("common.loading")} />
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-6">
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
                  title={t("admin.paymentsPage.noPayments")}
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.paymentsPage.trip")}</TableHead>
                        <TableHead>{t("admin.paymentsPage.payer")}</TableHead>
                        <TableHead>{t("admin.paymentsPage.amount")}</TableHead>
                        <TableHead>{t("admin.paymentsPage.method")}</TableHead>
                        <TableHead>{t("admin.paymentsPage.status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.pageItems.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.tripId}</TableCell>
                          <TableCell>{payment.payerId}</TableCell>
                          <TableCell>
                            {payment.currency} {payment.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell>
                            <Badge tone={STATUS_TONE[payment.status] ?? "neutral"}>
                              {t(`admin.paymentStatus.${payment.status}`)}
                            </Badge>
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
                    summary={t("admin.table.pageSummary", {
                      current: table.page,
                      total: table.pageCount,
                    })}
                  />
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
