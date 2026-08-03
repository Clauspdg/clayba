import { adminFirestore } from "@/lib/firebase-client";
import {
  discardSingletonDraft,
  publishSingletonArea,
  restoreSingletonFromHistory,
  saveSingletonDraft,
  subscribeSingletonDraft,
  subscribeSingletonPublished,
  type SingletonArea,
} from "@/lib/site-content-admin";
import { useAuth } from "@the-ride/hooks";
import type { Timestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

const META_KEYS = new Set(["createdAt", "updatedAt", "updatedBy", "publishedAt", "publishedBy"]);

function contentEquals(
  a: Record<string, unknown> | null,
  b: Record<string, unknown> | null,
): boolean {
  const strip = (data: Record<string, unknown> | null) => {
    if (!data) return null;
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(data)) if (!META_KEYS.has(key)) copy[key] = data[key];
    return copy;
  };
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}

function toDate(value: unknown): Date | undefined {
  return value && typeof value === "object" && "toDate" in value
    ? (value as Timestamp).toDate()
    : undefined;
}

/**
 * Shared hook for the singleton content areas — Homepage/Hero, Sections,
 * Footer, SEO, Downloads (Sprint 7.1 Site Content CMS). Subscribes to both
 * the draft and published trees live, and exposes the save/publish/discard
 * operations each editor page needs without re-deriving the Firestore
 * plumbing per page.
 */
export function useSingletonContentArea<T extends Record<string, unknown>>(area: SingletonArea) {
  const { session } = useAuth();
  const uid = session?.uid ?? "";
  const email = session?.email ?? uid;

  const [draft, setDraft] = useState<T | null | undefined>(undefined);
  const [published, setPublished] = useState<T | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  useEffect(() => {
    const unsubDraft = subscribeSingletonDraft<T>(adminFirestore, area, setDraft, setError);
    const unsubPublished = subscribeSingletonPublished<T>(
      adminFirestore,
      area,
      setPublished,
      setError,
    );
    return () => {
      unsubDraft();
      unsubPublished();
    };
  }, [area]);

  const hasUnpublishedChanges = useMemo(() => {
    if (draft === undefined || published === undefined) return false;
    return !contentEquals(draft, published);
  }, [draft, published]);

  async function save(content: object): Promise<void> {
    setSaving(true);
    try {
      await saveSingletonDraft(adminFirestore, area, uid, content);
    } finally {
      setSaving(false);
    }
  }

  async function publish(): Promise<void> {
    setPublishing(true);
    try {
      await publishSingletonArea(adminFirestore, area, uid, email);
    } finally {
      setPublishing(false);
    }
  }

  async function discardDraft(): Promise<void> {
    setDiscarding(true);
    try {
      await discardSingletonDraft(adminFirestore, area, uid);
    } finally {
      setDiscarding(false);
    }
  }

  async function restoreFromHistory(snapshot: Record<string, unknown>): Promise<void> {
    await restoreSingletonFromHistory(adminFirestore, area, snapshot, uid);
  }

  return {
    draft,
    published,
    loading: draft === undefined || published === undefined,
    error,
    saving,
    publishing,
    discarding,
    hasUnpublishedChanges,
    publishedAt: toDate(published?.publishedAt),
    save,
    publish,
    discardDraft,
    restoreFromHistory,
  };
}
