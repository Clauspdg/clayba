import { adminFirestore } from "@/lib/firebase-client";
import { subscribeHistory } from "@/lib/site-content-history-admin";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
} from "@the-ride/ui";
import type { SiteContentHistoryEntry } from "@the-ride/types";
import type { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";

function toDate(value: unknown): Date | undefined {
  return value && typeof value === "object" && "toDate" in value
    ? (value as Timestamp).toDate()
    : undefined;
}

export interface HistoryPanelProps {
  area: string;
  onRestore: (snapshot: Record<string, unknown> | Record<string, unknown>[]) => Promise<void>;
}

/**
 * Version history (Sprint 7.2 Site Content CMS) — one shared panel rendered
 * below `PublishBar` in every editor. Restoring copies the chosen snapshot
 * back into the *draft*, never straight to published, so an admin still
 * reviews and re-publishes — see `restoreSingletonFromHistory`/
 * `restoreTestimonialsFromHistory`/`restoreFaqFromHistory` for the write side.
 */
export function HistoryPanel({ area, onRestore }: HistoryPanelProps) {
  const [entries, setEntries] = useState<SiteContentHistoryEntry[] | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => subscribeHistory(adminFirestore, area, setEntries, () => setEntries([])), [area]);

  async function handleRestore(entry: SiteContentHistoryEntry) {
    setRestoringId(entry.id);
    try {
      await onRestore(entry.snapshot as Record<string, unknown> | Record<string, unknown>[]);
    } finally {
      setRestoringId(null);
    }
  }

  if (!entries || entries.length === 0) return null;

  return (
    <Accordion
      type="single"
      collapsible
      className="rounded-xl border border-neutral-200 px-4 dark:border-neutral-800"
    >
      <AccordionItem value="history" className="border-b-0">
        <AccordionTrigger>Version history ({entries.length})</AccordionTrigger>
        <AccordionContent>
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-900"
              >
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{entry.action}</Badge>
                  <span className="text-neutral-600 dark:text-neutral-300">{entry.actorEmail}</span>
                  <span className="text-xs text-neutral-400">
                    {toDate(entry.createdAt)?.toLocaleString() ?? ""}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleRestore(entry)}
                  isLoading={restoringId === entry.id}
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
