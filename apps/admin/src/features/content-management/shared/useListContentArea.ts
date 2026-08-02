import { useAuth } from "@the-ride/hooks";
import type { Timestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

const META_KEYS = new Set(["createdAt", "updatedAt", "updatedBy", "publishedAt", "publishedBy"]);

function stripMeta(item: Record<string, unknown>): Record<string, unknown> {
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(item)) if (!META_KEYS.has(key)) copy[key] = item[key];
  return copy;
}

function listEquals(a: Record<string, unknown>[], b: Record<string, unknown>[]): boolean {
  if (a.length !== b.length) return false;
  return JSON.stringify(a.map(stripMeta)) === JSON.stringify(b.map(stripMeta));
}

function latestTimestamp(items: Record<string, unknown>[], field: string): Date | undefined {
  const dates = items
    .map((item) => item[field])
    .filter(
      (value): value is Timestamp =>
        Boolean(value) && typeof value === "object" && "toDate" in (value as object),
    )
    .map((ts) => ts.toDate());
  if (dates.length === 0) return undefined;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

export interface ListContentAreaOps<T extends { id: string }> {
  subscribeDraft: (onNext: (items: T[]) => void, onError: (message: string) => void) => () => void;
  subscribePublished: (
    onNext: (items: T[]) => void,
    onError: (message: string) => void,
  ) => () => void;
  publish: (publishedBy: string) => Promise<void>;
  discardDraft: (updatedBy: string) => Promise<void>;
}

/**
 * Shared hook for the list content areas — Testimonials and FAQ (Sprint 7.1
 * Site Content CMS). Individual create/update/delete/reorder calls go
 * straight through the area-specific `lib/site-*-admin.ts` module (they
 * differ per schema); this hook only handles the two things that are
 * identical across every list: subscribing to both trees, and exposing
 * publish/discard with a computed `hasUnpublishedChanges`.
 */
export function useListContentArea<T extends { id: string }>(ops: ListContentAreaOps<T>) {
  const { session } = useAuth();
  const uid = session?.uid ?? "";

  const [draftItems, setDraftItems] = useState<T[] | undefined>(undefined);
  const [publishedItems, setPublishedItems] = useState<T[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  useEffect(() => {
    const unsubDraft = ops.subscribeDraft(setDraftItems, setError);
    const unsubPublished = ops.subscribePublished(setPublishedItems, setError);
    return () => {
      unsubDraft();
      unsubPublished();
    };
    // `ops` is a fresh object literal from the caller every render; its methods are stable module-level functions, so it's intentionally excluded here.
  }, []);

  const hasUnpublishedChanges = useMemo(() => {
    if (draftItems === undefined || publishedItems === undefined) return false;
    return !listEquals(draftItems, publishedItems);
  }, [draftItems, publishedItems]);

  async function publish(): Promise<void> {
    setPublishing(true);
    try {
      await ops.publish(uid);
    } finally {
      setPublishing(false);
    }
  }

  async function discardDraft(): Promise<void> {
    setDiscarding(true);
    try {
      await ops.discardDraft(uid);
    } finally {
      setDiscarding(false);
    }
  }

  return {
    draftItems,
    publishedItems,
    loading: draftItems === undefined || publishedItems === undefined,
    error,
    publishing,
    discarding,
    hasUnpublishedChanges,
    publishedAt: publishedItems ? latestTimestamp(publishedItems, "publishedAt") : undefined,
    publish,
    discardDraft,
  };
}
