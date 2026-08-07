"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { assignTicketToMe, resolveTicket } from "@/lib/support-admin";
import { useTableState } from "@/lib/useTableState";
import {
  Badge,
  Button,
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
import { useAuth } from "@the-ride/hooks";
import { SupportTicketStatus, type SupportTicket } from "@the-ride/types";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  open: "warning",
  assigned: "brand",
  in_progress: "brand",
  resolved: "success",
  closed: "neutral",
};

const PRIORITY_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  low: "neutral",
  medium: "brand",
  high: "warning",
  urgent: "danger",
};

export function SupportTicketsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { session } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(adminFirestore, "supportTickets"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) =>
        setTickets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as SupportTicket)),
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  const table = useTableState({
    data: tickets ?? [],
    searchFields: ["subject", "requesterId"],
    pageSize: 10,
  });

  async function handleAssign(ticket: SupportTicket) {
    setBusyId(ticket.id);
    try {
      await assignTicketToMe(adminFirestore, ticket.id, session?.uid ?? "");
      toast({ variant: "success", title: t("admin.support.assigned") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolve(ticket: SupportTicket) {
    setBusyId(ticket.id);
    try {
      await resolveTicket(adminFirestore, ticket.id);
      toast({ variant: "success", title: t("admin.support.resolved") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />;
  }

  if (tickets === null) {
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
          title={t("admin.support.noTickets")}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.support.subject")}</TableHead>
                <TableHead>{t("admin.support.requester")}</TableHead>
                <TableHead>{t("admin.support.priority")}</TableHead>
                <TableHead>{t("admin.support.status")}</TableHead>
                <TableHead>{t("admin.support.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageItems.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>{ticket.requesterId}</TableCell>
                  <TableCell>
                    <Badge tone={PRIORITY_TONE[ticket.priority] ?? "neutral"}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[ticket.status] ?? "neutral"}>{ticket.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {ticket.status === SupportTicketStatus.OPEN && (
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={busyId === ticket.id}
                          onClick={() => void handleAssign(ticket)}
                        >
                          {t("admin.support.assign")}
                        </Button>
                      )}
                      {ticket.status !== SupportTicketStatus.RESOLVED &&
                        ticket.status !== SupportTicketStatus.CLOSED && (
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={busyId === ticket.id}
                            onClick={() => void handleResolve(ticket)}
                          >
                            {t("admin.support.resolve")}
                          </Button>
                        )}
                    </div>
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
