"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { uploadAndCatalogSiteMedia } from "@/lib/site-media-admin";
import { useAuth } from "@the-ride/hooks";
import { Button, ErrorState, Heading, Input, LoadingState, useToast } from "@the-ride/ui";
import type { BilingualText, DownloadsContent } from "@the-ride/types";
import { useEffect, useState } from "react";

import { BilingualTextField } from "../shared/BilingualTextField";
import { HistoryPanel } from "../shared/HistoryPanel";
import { PublishBar } from "../shared/PublishBar";
import { useSingletonContentArea } from "../shared/useSingletonContentArea";

const EMPTY_TEXT: BilingualText = { fr: "", en: "" };

interface DownloadsForm {
  title: BilingualText;
  description: BilingualText;
  appStoreUrl?: string;
  playStoreUrl?: string;
  qrCodeUrl?: string;
  phoneMockupImageUrl?: string;
}

const EMPTY_FORM: DownloadsForm = { title: EMPTY_TEXT, description: EMPTY_TEXT };

function toForm(content: DownloadsContent | null | undefined): DownloadsForm {
  if (!content) return EMPTY_FORM;
  return {
    title: content.title ?? EMPTY_TEXT,
    description: content.description ?? EMPTY_TEXT,
    appStoreUrl: content.appStoreUrl,
    playStoreUrl: content.playStoreUrl,
    qrCodeUrl: content.qrCodeUrl,
    phoneMockupImageUrl: content.phoneMockupImageUrl,
  };
}

/**
 * Content Management → Download Section editor (Sprint 7.2 Site Content
 * CMS) — un-stubbed from Sprint 7.1's schema-only placeholder. Once real
 * App Store / Google Play URLs are published, `apps/web`'s
 * `DownloadAppSection` swaps from its disabled placeholder buttons to real
 * links.
 */
export function DownloadsContentPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const area = useSingletonContentArea<DownloadsContent>("downloads");
  const [form, setForm] = useState<DownloadsForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [uploadingField, setUploadingField] = useState<"qrCodeUrl" | "phoneMockupImageUrl" | null>(
    null,
  );

  useEffect(() => {
    if (!hydrated && area.draft !== undefined) {
      setForm(toForm(area.draft));
      setHydrated(true);
    }
  }, [area.draft, hydrated]);

  async function handleImageUpload(file: File, field: "qrCodeUrl" | "phoneMockupImageUrl") {
    setUploadingField(field);
    try {
      const item = await uploadAndCatalogSiteMedia(
        adminFirestore,
        "downloads",
        session?.uid ?? "",
        file,
      );
      setForm((prev) => ({ ...prev, [field]: item.url }));
      toast({ variant: "success", title: "Image uploaded" });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSave() {
    try {
      await area.save(form);
      toast({ variant: "success", title: "Draft saved" });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Save failed" });
    }
  }

  async function handlePublish() {
    try {
      await area.publish();
      toast({ variant: "success", title: "Download section published" });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Publish failed" });
    }
  }

  async function handleDiscard() {
    try {
      await area.discardDraft();
      setHydrated(false);
      toast({ variant: "success", title: "Draft reverted to published version" });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Discard failed" });
    }
  }

  async function handleRestore(snapshot: Record<string, unknown> | Record<string, unknown>[]) {
    try {
      await area.restoreFromHistory(snapshot as Record<string, unknown>);
      setHydrated(false);
      toast({ variant: "success", title: "Draft restored from history" });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Restore failed" });
    }
  }

  if (area.error) return <ErrorState title="Something went wrong" description={area.error} />;
  if (area.loading) return <LoadingState title="Loading…" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={2}>Download Section</Heading>
        <Button onClick={() => void handleSave()}>Save draft</Button>
      </div>

      <PublishBar
        hasUnpublishedChanges={area.hasUnpublishedChanges}
        publishedAt={area.publishedAt}
        isPublishing={area.publishing}
        isDiscarding={area.discarding}
        onPublish={() => void handlePublish()}
        onDiscardDraft={() => void handleDiscard()}
      />

      <HistoryPanel area="downloads" onRestore={handleRestore} />

      <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <BilingualTextField
          label="Title"
          value={form.title}
          onChange={(title) => setForm({ ...form, title })}
        />
        <BilingualTextField
          label="Description"
          value={form.description}
          onChange={(description) => setForm({ ...form, description })}
          multiline
          rows={2}
        />
        <div className="tablet:grid-cols-2 grid gap-4">
          <Input
            label="App Store URL"
            value={form.appStoreUrl ?? ""}
            onChange={(e) => setForm({ ...form, appStoreUrl: e.target.value })}
          />
          <Input
            label="Google Play URL"
            value={form.playStoreUrl ?? ""}
            onChange={(e) => setForm({ ...form, playStoreUrl: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <Heading level={3}>Images</Heading>
        <div className="tablet:grid-cols-2 grid gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              Phone mockup screenshot
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Upload phone mockup image"
              className="text-sm"
              disabled={uploadingField === "phoneMockupImageUrl"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImageUpload(file, "phoneMockupImageUrl");
              }}
            />
            {form.phoneMockupImageUrl && (
              <img
                src={form.phoneMockupImageUrl}
                alt=""
                className="h-32 w-full rounded-lg object-cover"
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              QR code
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Upload QR code image"
              className="text-sm"
              disabled={uploadingField === "qrCodeUrl"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImageUpload(file, "qrCodeUrl");
              }}
            />
            {form.qrCodeUrl && (
              <img src={form.qrCodeUrl} alt="" className="h-32 w-full rounded-lg object-cover" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
