"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { uploadAndCatalogSiteMedia } from "@/lib/site-media-admin";
import { useAuth } from "@the-ride/hooks";
import {
  Badge,
  Button,
  ErrorState,
  Heading,
  LoadingState,
  Select,
  Text,
  useToast,
} from "@the-ride/ui";
import type { BilingualText, HomepageContent } from "@the-ride/types";
import { useEffect, useState } from "react";

import { BilingualTextField } from "../shared/BilingualTextField";
import { PublishBar } from "../shared/PublishBar";
import { useSingletonContentArea } from "../shared/useSingletonContentArea";

const EMPTY_TEXT: BilingualText = { fr: "", en: "" };

interface HomepageForm {
  eyebrow: BilingualText;
  title: BilingualText;
  subtitle: BilingualText;
  ctaPassengerLabel: BilingualText;
  ctaDriverLabel: BilingualText;
  backgroundType: "gradient" | "image" | "video";
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
}

const EMPTY_FORM: HomepageForm = {
  eyebrow: EMPTY_TEXT,
  title: EMPTY_TEXT,
  subtitle: EMPTY_TEXT,
  ctaPassengerLabel: EMPTY_TEXT,
  ctaDriverLabel: EMPTY_TEXT,
  backgroundType: "gradient",
};

function toForm(content: HomepageContent | null | undefined): HomepageForm {
  if (!content) return EMPTY_FORM;
  return {
    eyebrow: content.eyebrow ?? EMPTY_TEXT,
    title: content.title ?? EMPTY_TEXT,
    subtitle: content.subtitle ?? EMPTY_TEXT,
    ctaPassengerLabel: content.ctaPassengerLabel ?? EMPTY_TEXT,
    ctaDriverLabel: content.ctaDriverLabel ?? EMPTY_TEXT,
    backgroundType: content.backgroundType ?? "gradient",
    backgroundImageUrl: content.backgroundImageUrl,
    backgroundVideoUrl: content.backgroundVideoUrl,
  };
}

/**
 * Content Management → Homepage editor (Sprint 7.1 Site Content CMS) — the
 * public landing page's Hero: eyebrow/title/subtitle/CTA copy in both
 * languages, plus an optional image or video background. Leaving
 * `backgroundType` as "gradient" (the default) keeps the Hero's existing
 * hand-crafted animated treatment untouched on the public site.
 */
export function HomepageContentPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const area = useSingletonContentArea<HomepageContent>("homepage");
  const [form, setForm] = useState<HomepageForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!hydrated && area.draft !== undefined) {
      setForm(toForm(area.draft));
      setHydrated(true);
    }
  }, [area.draft, hydrated]);

  async function handleBackgroundUpload(file: File, kind: "image" | "video") {
    setUploading(true);
    try {
      const item = await uploadAndCatalogSiteMedia(
        adminFirestore,
        "hero",
        session?.uid ?? "",
        file,
      );
      setForm((prev) => ({
        ...prev,
        backgroundType: kind,
        backgroundImageUrl: kind === "image" ? item.url : prev.backgroundImageUrl,
        backgroundVideoUrl: kind === "video" ? item.url : prev.backgroundVideoUrl,
      }));
      toast({ variant: "success", title: "Background uploaded" });
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
        <BilingualTextField
          label="Primary button (passenger)"
          value={form.ctaPassengerLabel}
          onChange={(ctaPassengerLabel) => setForm({ ...form, ctaPassengerLabel })}
        />
        <BilingualTextField
          label="Secondary button (driver)"
          value={form.ctaDriverLabel}
          onChange={(ctaDriverLabel) => setForm({ ...form, ctaDriverLabel })}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <Heading level={3}>Hero background</Heading>
        <Text size="sm" tone="muted">
          Leave this as "Gradient" to keep the site's default animated background. Choosing an image
          or video replaces it on the public homepage.
        </Text>
        <Select
          label="Background type"
          value={form.backgroundType}
          onValueChange={(value) =>
            setForm({ ...form, backgroundType: value as HomepageForm["backgroundType"] })
          }
          options={[
            { value: "gradient", label: "Gradient (default)" },
            { value: "image", label: "Image" },
            { value: "video", label: "Video" },
          ]}
        />
        {form.backgroundType === "image" && (
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Upload background image"
              className="text-sm"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleBackgroundUpload(file, "image");
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
        )}
        {form.backgroundType === "video" && (
          <div className="flex flex-col gap-2">
            <Badge tone="neutral">MP4, 3-10 seconds, under 20MB</Badge>
            <input
              type="file"
              accept="video/mp4"
              aria-label="Upload background video"
              className="text-sm"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleBackgroundUpload(file, "video");
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
        )}
      </div>
    </div>
  );
}
