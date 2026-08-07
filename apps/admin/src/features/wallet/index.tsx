"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { exportToCsv } from "@/lib/csv";
import { useTableState } from "@/lib/useTableState";
import {
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
import type { Wallet } from "@the-ride/types";
import { collection, limit as fsLimit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

/**
 * Wallet (Web Phase W1, Parts 5-6) — live, read-only Firestore list from
 * `wallets`. Deliberately no balance-edit action: real balance changes
 * must go through the `transactions` ledger (see `wallet.schemas.ts`),
 * not a direct field overwrite, or the ledger and balance would drift
 * out of sync.
 */
export function WalletPage() {
  const { t } = useTranslation();
  const [wallets, setWallets] = useState<Wallet[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(adminFirestore, "wallets"),
      orderBy("createdAt", "desc"),
      fsLimit(500),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => setWallets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Wallet)),
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  const table = useTableState({
    data: wallets ?? [],
    searchFields: ["id", "ownerId"],
    pageSize: 10,
  });

  function handleExport() {
    exportToCsv(
      "wallets",
      table.pageItems.map((wallet) => ({
        id: wallet.id,
        ownerId: wallet.ownerId,
        ownerType: wallet.ownerType,
        balance: wallet.balance,
        currency: wallet.currency,
      })),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.wallet")}</Heading>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.walletPage.title")}</CardTitle>
          <CardDescription>{t("admin.walletPage.description")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6">
              <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />
            </div>
          ) : wallets === null ? (
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
                  title={t("admin.walletPage.noWallets")}
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.walletPage.owner")}</TableHead>
                        <TableHead>{t("admin.walletPage.ownerType")}</TableHead>
                        <TableHead>{t("admin.walletPage.balance")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.pageItems.map((wallet) => (
                        <TableRow key={wallet.id}>
                          <TableCell>{wallet.ownerId}</TableCell>
                          <TableCell>{wallet.ownerType}</TableCell>
                          <TableCell>
                            {wallet.currency} {wallet.balance.toFixed(2)}
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
