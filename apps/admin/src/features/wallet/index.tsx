"use client";

import { adminFirestore, adminFunctions } from "@/lib/firebase-client";
import { exportToCsv } from "@/lib/csv";
import { useTableState } from "@/lib/useTableState";
import { recordDriverCashDeposit } from "@the-ride/firebase/client";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  Heading,
  Illustration,
  Input,
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
import { WalletOwnerType, type Wallet } from "@the-ride/types";
import { collection, limit as fsLimit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

/**
 * Wallet (Web Phase W1, Parts 5-6) — live, read-only Firestore list from
 * `wallets`. Deliberately no balance-edit action: real balance changes
 * must go through the `transactions` ledger (see `wallet.schemas.ts`),
 * not a direct field overwrite, or the ledger and balance would drift
 * out of sync.
 */
export function WalletPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
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

  // Payments — a driver handing over the platform's share of cash rides.
  // Goes through the admin-only `recordDriverCashDeposit` callable (ledger
  // entry + audit log), never a direct balance write.
  const [depositFor, setDepositFor] = useState<Wallet | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [depositSaving, setDepositSaving] = useState(false);
  const depositRequestId = useRef("");

  function openDeposit(wallet: Wallet) {
    setDepositFor(wallet);
    setDepositAmount(wallet.balance < 0 ? (-wallet.balance).toFixed(2) : "");
    setDepositNote("");
    depositRequestId.current = crypto.randomUUID();
  }

  async function handleRecordDeposit() {
    if (!depositFor) return;
    setDepositSaving(true);
    try {
      await recordDriverCashDeposit(adminFunctions, {
        driverId: depositFor.ownerId,
        amount: Number(depositAmount),
        note: depositNote,
        clientRequestId: depositRequestId.current,
      });
      toast({ variant: "success", title: t("payments.depositRecorded") });
      setDepositFor(null);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setDepositSaving(false);
    }
  }

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
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.pageItems.map((wallet) => (
                        <TableRow key={wallet.id}>
                          <TableCell>{wallet.ownerId}</TableCell>
                          <TableCell>{wallet.ownerType}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              {wallet.currency} {wallet.balance.toFixed(2)}
                              {wallet.balance < 0 && (
                                <Badge tone="warning">{t("payments.owedToPlatform")}</Badge>
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            {wallet.ownerType === WalletOwnerType.DRIVER && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDeposit(wallet)}
                              >
                                {t("payments.recordDeposit")}
                              </Button>
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

      <Dialog open={Boolean(depositFor)} onOpenChange={(open) => !open && setDepositFor(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("payments.recordDeposit")}</DialogTitle>
          </DialogHeader>
          <Input
            type="number"
            step="0.01"
            min="0"
            label={`${t("payments.depositAmount")} (${depositFor?.currency ?? "USD"})`}
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <Input
            label={t("payments.depositNote")}
            value={depositNote}
            onChange={(e) => setDepositNote(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => void handleRecordDeposit()}
              isLoading={depositSaving}
              disabled={!(Number(depositAmount) > 0)}
            >
              {t("admin.settingsForm.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
