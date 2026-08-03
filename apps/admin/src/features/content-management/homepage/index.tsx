"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { uploadAndCatalogSiteMedia } from "@/lib/site-media-admin";
import { useAuth } from "@the-ride/hooks";
import {
  Badge,
  Button,
  ErrorState,
  Heading,
  Input,
  LoadingState,
  Switch,
  Text,
  useToast,
} from "@the-ride/ui";
import type { BilingualText, HomepageContent } from "@the-ride/types";
import { useEffect, useState } from "react";

import { BilingualTextField } from "../shared/BilingualTextField";
import { HistoryPanel } from "../shared/HistoryPanel";
import { PublishBar } from "../shared/PublishBar";
import { useSingletonContentArea } from "../shared/useSingletonContentArea";

const EMPTY_TEXT: BilingualText = { fr: "", en: "" };

type BackgroundImageField =
  | "backgroundDesktopImageUrl"
  | "backgroundTabletImageUrl"
  | "backgroundMobileImageUrl"
  | "backgroundPosterImageUrl";
type BackgroundVideoField = "backgroundDesktopVideoUrl" | "backgroundMobileVideoUrl";

interface HomepageForm {
  eyebrow: BilingualText;
  title: BilingualText;
  subtitle: BilingualText;
  ctaPassengerLabel: BilingualText;
  ctaDriverLabel: BilingualText;
  ctaPassengerEnabled: boolean;
  ctaPassengerHref: string;
  ctaDriverEnabled: boolean;
  ctaDriverHref: string;
  backgroundDesktopImageUrl?: string;
  backgroundTabletImageUrl?: string;
  backgroundMobileImageUrl?: string;
  backgroundDesktopVideoUrl?: string;
  backgroundMobileVideoUrl?: string;
  backgroundPosterImageUrl?: string;
}

const EMPTY_FORM: HomepageForm = {
  eyebrow: EMPTY_TEXT,
  title: EMPTY_TEXT,
  subtitle: EMPTY_TEXT,
  ctaPassengerLabel: EMPTY_TEXT,
  ctaDriverLabel: EMPTY_TEXT,
  ctaPassengerEnabled: true,
  ctaPassengerHref: "/services",
  ctaDriverEnabled: true,
  ctaDriverHref: "/become-a-driver",
};

function toForm(content: HomepageContent | null | undefined): HomepageForm {
  if (!content) return EMPTY_FORM;
  return {
    eyebrow: content.eyebrow ?? EMPTY_TEXT,
    title: content.title ?? EMPTY_TEXT,
    subtitle: content.subtitle ?? EMPTY_TEXT,
    ctaPassengerLabel: content.ctaPassengerLabel ?? EMPTY_TEXT,
    ctaDriverLabel: content.ctaDriverLabel ?? EMPTY_TEXT,
    ctaPassengerEnabled: content.ctaPassengerEnabled ?? true,
    ctaPassengerHref: content.ctaPassengerHref ?? "/services",
    ctaDriverEnabled: content.ctaDriverEnabled ?? true,
    ctaDriverHref: content.ctaDriverHref ?? "/become-a-driver",
    backgroundDesktopImageUrl: content.backgroundDesktopImageUrl,
    backgroundTabletImageUrl: content.backgroundTabletImageUrl,
    backgroundMobileImageUrl: content.backgroundMobileImageUrl,
    backgroundDesktopVideoUrl: content.backgroundDesktopVideoUrl,
    backgroundMobileVideoUrl: content.backgroundMobileVideoUrl,
    backgroundPosterImageUrl: content.backgroundPosterImageUrl,
  };
}

/**
 * Content Management → Homepage editor (Sprint 7.2 Site Content CMS) — the
 * public landing page's Hero: eyebrow/title/subtitle/CTA copy in both
 * languages, per-button enable/link, and a per-breakpoint image/video
 * background. Leaving every background field empty keeps the Hero's
 * existing hand-crafted animated treatment untouched on the public site.
 */
export function HomepageContentPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const area = useSingletonContentArea<HomepageContent>("homepage");
  const [form, setForm] = useState<HomepageForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated && area.draft !== undefined) {
      setForm(toForm(area.draft));
      setHydrated(true);
    }
  }, [area.draft, hydrated]);

  async function handleImageUpload(file: File, field: BackgroundImageField) {
    setUploadingField(field);
    try {
      const item = await uploadAndCatalogSiteMedia(
        adminFirestore,
        "hero",
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

  async function handleVideoUpload(file: File, field: BackgroundVideoField) {
    setUploadingField(field);
    try {
      const item = await uploadAndCatalogSiteMedia(
        adminFirestore,
        "hero",
        session?.uid ?? "",
        file,
      );
      setForm((prev) => ({ ...prev, [field]: item.url }));
      toast({ variant: "success", title: "Video uploaded" });
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
      toast({ variant: "success", title: "Homepage published" });
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
        <Heading level={2}>Homepage</Heading>
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

      <HistoryPanel area="homepage" onRestore={handleRestore} />

      <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <BilingualTextField
          label="Eyebrow"
          value={form.eyebrow}
          onChange={(eyebrow) => setForm({ ...form, eyebrow })}
        />
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

        <div className="flex flex-col gap-2 rounded-lg border border-neutral-100 p-4 dark:border-neutral-800">
          <Switch
            label="Show primary button (passenger)"
            checked={form.ctaPassengerEnabled}
            onCheckedChange={(ctaPassengerEnabled) => setForm({ ...form, ctaPassengerEnabled })}
          />
          <BilingualTextField
            label="Primary button label"
            value={form.ctaPassengerLabel}
            onChange={(ctaPassengerLabel) => setForm({ ...form, ctaPassengerLabel })}
          />
          <Input
            label="Primary button link"
            value={form.ctaPassengerHref}
            onChange={(e) => setForm({ ...form, ctaPassengerHref: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-neutral-100 p-4 dark:border-neutral-800">
          <Switch
            label="Show secondary button (driver)"
            checked={form.ctaDriverEnabled}
            onCheckedChange={(ctaDriverEnabled) => setForm({ ...form, ctaDriverEnabled })}
          />
          <BilingualTextField
            label="Secondary button label"
            value={form.ctaDriverLabel}
            onChange={(ctaDriverLabel) => setForm({ ...form, ctaDriverLabel })}
          />
          <Input
            label="Secondary button link"
            value={form.ctaDriverHref}
            onChange={(e) => setForm({ ...form, ctaDriverHref: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <Heading level={3}>Hero background</Heading>
        <Text size="sm" tone="muted">
          Leave every field below empty to keep the site's default animated background. An admin can
          configure a different image or video per breakpoint — the site falls back from mobile to
          tablet to desktop when a smaller breakpoint isn't set.
        </Text>

        <div className="tablet:grid-cols-3 grid gap-4">
          <ImageUploadField
            label="Desktop image"
            value={form.backgroundDesktopImageUrl}
            uploading={uploadingField === "backgroundDesktopImageUrl"}
            onUpload={(file) => handleImageUpload(file, "backgroundDesktopImageUrl")}
          />
          <ImageUploadField
            label="Tablet image"
            value={form.backgroundTabletImageUrl}
            uploading={uploadingField === "backgroundTabletImageUrl"}
            onUpload={(file) => handleImageUpload(file, "backgroundTabletImageUrl")}
          />
          <ImageUploadField
            label="Mobile image"
            value={form.backgroundMobileImageUrl}
            uploading={uploadingField === "backgroundMobileImageUrl"}
            onUpload={(file) => handleImageUpload(file, "backgroundMobileImageUrl")}
          />
        </div>

        <Badge tone="neutral" className="self-start">
          Videos: MP4, 3-10 seconds, under 20MB
        </Badge>
        <div className="tablet:grid-cols-2 grid gap-4">
          <VideoUploadField
            label="Desktop video"
            value={form.backgroundDesktopVideoUrl}
            uploading={uploadingField === "backgroundDesktopVideoUrl"}
            onUpload={(file) => handleVideoUpload(file, "backgroundDesktopVideoUrl")}
          />
          <VideoUploadField
            label="Mobile video"
            value={form.backgroundMobileVideoUrl}
            uploading={uploadingField === "backgroundMobileVideoUrl"}
            onUpload={(file) => handleVideoUpload(file, "backgroundMobileVideoUrl")}
          />
        </div>

        <ImageUploadField
          label="Poster image (shown while video loads)"
          value={form.backgroundPosterImageUrl}
          uploading={uploadingField === "backgroundPosterImageUrl"}
          onUpload={(file) => handleImageUpload(file, "backgroundPosterImageUrl")}
        />
      </div>
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  uploading,
  onUpload,
}: {
  label: string;
  value?: string;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{label}</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={label}
        className="text-sm"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      {value && <img src={value} alt="" className="h-24 w-full rounded-lg object-cover" />}
    </div>
  );
}

function VideoUploadField({
  label,
  value,
  uploading,
  onUpload,
}: {
  label: string;
  value?: string;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{label}</span>
      <input
        type="file"
        accept="video/mp4"
        aria-label={label}
        className="text-sm"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      {value && (
        <video
          src={value}
          className="h-24 w-full rounded-lg object-cover"
          muted
          loop
          autoPlay
          playsInline
        />
      )}
    </div>
  );
}
