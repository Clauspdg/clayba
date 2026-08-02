"use client";

import {
  Button,
  ErrorState,
  Heading,
  Icon,
  Input,
  LoadingState,
  Switch,
  Text,
  useToast,
  type IconName,
} from "@the-ride/ui";
import type { BilingualText, FooterContent, SocialLink } from "@the-ride/types";
import { useEffect, useState } from "react";

import { BilingualTextField } from "../shared/BilingualTextField";
import { PublishBar } from "../shared/PublishBar";
import { useSingletonContentArea } from "../shared/useSingletonContentArea";

const EMPTY_TEXT: BilingualText = { fr: "", en: "" };

interface FooterForm {
  tagline: BilingualText;
  newsletterTitle: BilingualText;
  newsletterBody: BilingualText;
  showNewsletter: boolean;
  socialLinks: SocialLink[];
}

const EMPTY_FORM: FooterForm = {
  tagline: EMPTY_TEXT,
  newsletterTitle: EMPTY_TEXT,
  newsletterBody: EMPTY_TEXT,
  showNewsletter: true,
  socialLinks: [],
};

function toForm(content: FooterContent | null | undefined): FooterForm {
  if (!content) return EMPTY_FORM;
  return {
    tagline: content.tagline ?? EMPTY_TEXT,
    newsletterTitle: content.newsletterTitle ?? EMPTY_TEXT,
    newsletterBody: content.newsletterBody ?? EMPTY_TEXT,
    showNewsletter: content.showNewsletter ?? true,
    socialLinks: content.socialLinks ?? [],
  };
}

/**
 * Content Management → Footer editor (Sprint 7.1 Site Content CMS).
 * Deliberately narrow: only tagline, newsletter copy/toggle, and social
 * links are CMS-editable. The four nav-link columns (Company/Services/
 * Support/Legal) stay hardcoded — they're site navigation, not marketing
 * copy.
 */
export function FooterContentPage() {
  const { toast } = useToast();
  const area = useSingletonContentArea<FooterContent>("footer");
  const [form, setForm] = useState<FooterForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!hydrated && area.draft !== undefined) {
      setForm(toForm(area.draft));
      setHydrated(true);
    }
  }, [area.draft, hydrated]);

  function updateSocialLink(index: number, patch: Partial<SocialLink>) {
    setForm((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    }));
  }

  function addSocialLink() {
    setForm((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { icon: "globe", label: EMPTY_TEXT, href: "" }],
    }));
  }

  function removeSocialLink(index: number) {
    setForm((prev) => ({ ...prev, socialLinks: prev.socialLinks.filter((_, i) => i !== index) }));
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
      toast({ variant: "success", title: "Footer published" });
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
        <Heading level={2}>Footer</Heading>
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
          label="Tagline"
          value={form.tagline}
          onChange={(tagline) => setForm({ ...form, tagline })}
        />
        <Switch
          label="Show newsletter signup"
          checked={form.showNewsletter}
          onCheckedChange={(showNewsletter) => setForm({ ...form, showNewsletter })}
        />
        <BilingualTextField
          label="Newsletter title"
          value={form.newsletterTitle}
          onChange={(newsletterTitle) => setForm({ ...form, newsletterTitle })}
        />
        <BilingualTextField
          label="Newsletter body"
          value={form.newsletterBody}
          onChange={(newsletterBody) => setForm({ ...form, newsletterBody })}
          multiline
          rows={2}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <Heading level={3}>Social links</Heading>
          <Button size="sm" variant="outline" onClick={addSocialLink}>
            Add link
          </Button>
        </div>
        {form.socialLinks.length === 0 && (
          <Text size="sm" tone="muted">
            No social links yet.
          </Text>
        )}
        {form.socialLinks.map((link, index) => (
          <div
            key={index}
            className="flex items-end gap-3 rounded-lg border border-neutral-100 p-3 dark:border-neutral-800"
          >
            <Icon
              name={link.icon as IconName}
              size={18}
              className="mb-3 shrink-0 text-neutral-400"
            />
            <Input
              label="Icon key"
              value={link.icon}
              onChange={(e) => updateSocialLink(index, { icon: e.target.value })}
              className="max-w-[140px]"
            />
            <div className="flex-1">
              <BilingualTextField
                label="Label"
                value={link.label}
                onChange={(label) => updateSocialLink(index, { label })}
              />
            </div>
            <Input
              label="URL"
              value={link.href}
              onChange={(e) => updateSocialLink(index, { href: e.target.value })}
              className="max-w-[240px]"
            />
            <Button size="sm" variant="destructive" onClick={() => removeSocialLink(index)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
