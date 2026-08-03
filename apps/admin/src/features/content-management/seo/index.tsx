"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { uploadAndCatalogSiteMedia } from "@/lib/site-media-admin";
import { useAuth } from "@the-ride/hooks";
import { Badge, Button, ErrorState, Heading, Input, LoadingState, useToast } from "@the-ride/ui";
import type { BilingualText, SeoContent } from "@the-ride/types";
import { useEffect, useState } from "react";

import { BilingualTextField } from "../shared/BilingualTextField";
import { HistoryPanel } from "../shared/HistoryPanel";
import { PublishBar } from "../shared/PublishBar";
import { useSingletonContentArea } from "../shared/useSingletonContentArea";

const EMPTY_TEXT: BilingualText = { fr: "", en: "" };

interface SeoForm {
  title: BilingualText;
  description: BilingualText;
  keywords: string;
  ogImageUrl?: string;
  twitterCardImageUrl?: string;
  faviconUrl?: string;
}

const EMPTY_FORM: SeoForm = { title: EMPTY_TEXT, description: EMPTY_TEXT, keywords: "" };

function toForm(content: SeoContent | null | undefined): SeoForm {
  if (!content) return EMPTY_FORM;
  return {
    title: content.title ?? EMPTY_TEXT,
    description: content.description ?? EMPTY_TEXT,
    keywords: (content.keywords ?? []).join(", "),
    ogImageUrl: content.ogImageUrl,
    twitterCardImageUrl: content.twitterCardImageUrl,
    faviconUrl: content.faviconUrl,
  };
}

function toContent(form: SeoForm) {
  return {
    title: form.title,
    description: form.description,
    keywords: form.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    ogImageUrl: form.ogImageUrl,
    twitterCardImageUrl: form.twitterCardImageUrl,
    faviconUrl: form.faviconUrl,
  };
}

type ImageField = "ogImageUrl" | "twitterCardImageUrl" | "faviconUrl";

/**
 * Content Management → SEO editor (Sprint 8.3 — un-stubbed). This content
 * is stored and versioned like every other singleton area, but `apps/web`
 * is a static export (`output: "export"`), so `<head>` meta tags are baked
 * at BUILD time — this editor's values are NOT yet injected into the live
 * site's crawler-visible HTML. Wiring that up needs a build-time
 * Firestore-fetch pipeline, a separate infrastructure change, not a CMS
 * field. Disclosed here rather than silently implying this is live SEO.
 */
export function SeoContentPage() {
  const { toast } = useToast();
  const { session } = useAuth();
  const area = useSingletonContentArea<SeoContent>("seo");
  const [form, setForm] = useState<SeoForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [uploadingField, setUploadingField] = useState<ImageField | null>(null);

  useEffect(() => {
    if (!hydrated && area.draft !== undefined) {
      setForm(toForm(area.draft));
      setHydrated(true);
    }
  }, [area.draft, hydrated]);

  async function handleImageUpload(field: ImageField, file: File) {
    setUploadingField(field);
    try {
      const item = await uploadAndCatalogSiteMedia(
        adminFirestore,
        "sections",
        session?.uid ?? "",
        file,
      );
      setForm((prev) => ({ ...prev, [field]: item.url }));
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSave() {
    try {
      await area.save(toContent(form));
      toast({ variant: "success", title: "Draft saved" });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Save failed" });
    }
  }

  async function handlePublish() {
    try {
      await area.publish();
      toast({ variant: "success", title: "SEO content published" });
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
        <Heading level={2}>SEO</Heading>
        <Button onClick={() => void handleSave()}>Save draft</Button>
      </div>

      <Badge tone="warning" className="self-start">
        Ce contenu n&apos;est pas encore injecté dans le head du site (export statique) — nécessite
        un changement d&apos;infrastructure séparé.
      </Badge>

      <PublishBar
        hasUnpublishedChanges={area.hasUnpublishedChanges}
        publishedAt={area.publishedAt}
        isPublishing={area.publishing}
        isDiscarding={area.discarding}
        onPublish={() => void handlePublish()}
        onDiscardDraft={() => void handleDiscard()}
      />

      <HistoryPanel area="seo" onRestore={handleRestore} />

      <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <BilingualTextField
          label="Meta title"
          value={form.title}
          onChange={(title) => setForm({ ...form, title })}
        />
        <BilingualTextField
          label="Meta description"
          value={form.description}
          onChange={(description) => setForm({ ...form, description })}
          multiline
          rows={3}
        />
        <Input
          label="Keywords (comma-separated)"
          value={form.keywords}
          onChange={(e) => setForm({ ...form, keywords: e.target.value })}
          placeholder="ride-hailing, taxi, airport transfer"
        />

        {[
          { field: "ogImageUrl" as const, label: "Open Graph image" },
          { field: "twitterCardImageUrl" as const, label: "Twitter card image" },
          { field: "faviconUrl" as const, label: "Favicon" },
        ].map(({ field, label }) => (
          <div key={field} className="flex flex-col gap-2">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {label}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/x-icon,image/svg+xml"
              aria-label={label}
              className="text-sm"
              disabled={uploadingField === field}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImageUpload(field, file);
              }}
            />
            {form[field] && (
              <img src={form[field]} alt="" className="h-16 w-16 rounded-lg object-cover" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
