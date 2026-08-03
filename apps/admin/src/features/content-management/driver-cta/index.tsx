"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { uploadAndCatalogSiteMedia } from "@/lib/site-media-admin";
import { useAuth } from "@the-ride/hooks";
import { Badge, Button, ErrorState, Heading, Input, LoadingState, useToast } from "@the-ride/ui";
import type { BilingualText, DriverCtaContent } from "@the-ride/types";
import { useEffect, useState } from "react";

import { BilingualTextField } from "../shared/BilingualTextField";
import { HistoryPanel } from "../shared/HistoryPanel";
import { PublishBar } from "../shared/PublishBar";
import { useSingletonContentArea } from "../shared/useSingletonContentArea";

const EMPTY_TEXT: BilingualText = { fr: "", en: "" };

interface DriverCtaForm {
  title: BilingualText;
  subtitle: BilingualText;
  buttonLabel: BilingualText;
  buttonHref: string;
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
}

const EMPTY_FORM: DriverCtaForm = {
  title: EMPTY_TEXT,
  subtitle: EMPTY_TEXT,
  buttonLabel: EMPTY_TEXT,
  buttonHref: "/become-a-driver",
};

function toForm(content: DriverCtaContent | null | undefined): DriverCtaForm {
  if (!content) return EMPTY_FORM;
  return {
    title: content.title ?? EMPTY_TEXT,
    subtitle: content.subtitle ?? EMPTY_TEXT,
    buttonLabel: content.buttonLabel ?? EMPTY_TEXT,
    buttonHref: content.buttonHref ?? "/become-a-driver",
    backgroundImageUrl: content.backgroundImageUrl,
    backgroundVideoUrl: content.backgroundVideoUrl,
  };
}

/**
 * Content Management → Driver CTA editor (Sprint 7.2 Site Content CMS) —
 * the "become a driver" call-to-action banner. Background image/video use
 * the same show-video-with-image-fallback behavior as the Hero.
 */
export function DriverCtaContentPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const area = useSingletonContentArea<DriverCtaContent>("driverCta");
  const [form, setForm] = useState<DriverCtaForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!hydrated && area.draft !== undefined) {
      setForm(toForm(area.draft));
      setHydrated(true);
    }
  }, [area.draft, hydrated]);

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const item = await uploadAndCatalogSiteMedia(
        adminFirestore,
        "backgrounds",
        session?.uid ?? "",
        file,
      );
      setForm((prev) => ({ ...prev, backgroundImageUrl: item.url }));
      toast({ variant: "success", title: "Image uploaded" });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  async function handleVideoUpload(file: File) {
    setUploading(true);
    try {
      const item = await uploadAndCatalogSiteMedia(
        adminFirestore,
        "backgrounds",
        session?.uid ?? "",
        file,
      );
      setForm((prev) => ({ ...prev, backgroundVideoUrl: item.url }));
      toast({ variant: "success", title: "Video uploaded" });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploading(false);
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
      toast({ variant: "success", title: "Driver CTA published" });
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
        <Heading level={2}>Driver CTA</Heading>
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

      <HistoryPanel area="driverCta" onRestore={handleRestore} />

      <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <BilingualTextField
          label="Title"
          value={form.title}
          onChange={(title) => setForm({ ...form, title })}
        />
        <BilingualTextField
          label="Subtitle"
          value={form.subtitle}
          onChange={(subtitle) => setForm({ ...form, subtitle })}
          multiline
          rows={2}
        />
        <div className="grid grid-cols-[1fr_240px] items-end gap-4">
          <BilingualTextField
            label="Button label"
            value={form.buttonLabel}
            onChange={(buttonLabel) => setForm({ ...form, buttonLabel })}
          />
          <Input
            label="Button link"
            value={form.buttonHref}
            onChange={(e) => setForm({ ...form, buttonHref: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <Heading level={3}>Background</Heading>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Image</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Upload background image"
            className="text-sm"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageUpload(file);
            }}
          />
          {form.backgroundImageUrl && (
            <img
              src={form.backgroundImageUrl}
              alt=""
              className="h-32 w-full rounded-lg object-cover"
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Badge tone="neutral" className="self-start">
            Video: MP4, under 20MB
          </Badge>
          <input
            type="file"
            accept="video/mp4"
            aria-label="Upload background video"
            className="text-sm"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleVideoUpload(file);
            }}
          />
          {form.backgroundVideoUrl && (
            <video
              src={form.backgroundVideoUrl}
              className="h-32 w-full rounded-lg object-cover"
              muted
              loop
              autoPlay
              playsInline
            />
          )}
        </div>
      </div>
    </div>
  );
}
