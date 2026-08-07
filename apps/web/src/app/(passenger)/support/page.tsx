"use client";

import { webFirestore } from "@/lib/firebase-client";
import { createSupportTicket, subscribeMyTickets } from "@the-ride/firebase/client";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Heading,
  Illustration,
  Input,
  LoadingState,
  Select,
  Textarea,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import { SupportTicketPriority, type SupportTicket } from "@the-ride/types";
import { useEffect, useState } from "react";

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  open: "warning",
  assigned: "brand",
  in_progress: "brand",
  resolved: "success",
  closed: "neutral",
};

export default function SupportPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    priority: SupportTicketPriority.MEDIUM as SupportTicketPriority,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    return subscribeMyTickets(webFirestore, session.uid, setTickets, () => setTickets([]));
  }, [session]);

  async function handleCreate() {
    if (!session) return;
    setSaving(true);
    try {
      await createSupportTicket(webFirestore, { requesterId: session.uid, ...form });
      toast({ variant: "success", title: t("support.ticketCreated") });
      setCreating(false);
      setForm({ subject: "", description: "", priority: SupportTicketPriority.MEDIUM });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setSaving(false);
    }
  }

  if (tickets === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={2}>{t("passengerNav.support")}</Heading>
        <Button onClick={() => setCreating(true)}>{t("support.createTicket")}</Button>
      </div>

      {tickets.length === 0 ? (
        <EmptyState icon={<Illustration name="empty" size={80} />} title={t("support.noTickets")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  {ticket.subject}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {ticket.description}
                </p>
              </div>
              <Badge tone={STATUS_TONE[ticket.status] ?? "neutral"}>{ticket.status}</Badge>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("support.createTicket")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              label={t("support.subject")}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <Textarea
              label={t("support.description")}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
            />
            <Select
              label={t("support.priority")}
              value={form.priority}
              onValueChange={(value) =>
                setForm({ ...form, priority: value as SupportTicketPriority })
              }
              options={Object.values(SupportTicketPriority).map((priority) => ({
                value: priority,
                label: priority,
              }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => void handleCreate()}
              isLoading={saving}
              disabled={!form.subject.trim() || !form.description.trim()}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
