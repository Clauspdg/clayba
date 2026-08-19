"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { uploadAndCatalogSiteMedia } from "@/lib/site-media-admin";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "@the-ride/hooks";
import {
  Button,
  ErrorState,
  Heading,
  Icon,
  Input,
  LoadingState,
  Switch,
  useToast,
} from "@the-ride/ui";
import type { BilingualText, NavigationContent, NavigationItem } from "@the-ride/types";
import { useEffect, useState } from "react";

import { BilingualTextField } from "../shared/BilingualTextField";
import { HistoryPanel } from "../shared/HistoryPanel";
import { PublishBar } from "../shared/PublishBar";
import { useSingletonContentArea } from "../shared/useSingletonContentArea";

const EMPTY_TEXT: BilingualText = { fr: "", en: "" };

interface NavigationForm {
  logoImageUrl?: string;
  logoText?: string;
  items: NavigationItem[];
}

const EMPTY_FORM: NavigationForm = { logoImageUrl: undefined, logoText: "", items: [] };

function toForm(content: NavigationContent | null | undefined): NavigationForm {
  if (!content) return EMPTY_FORM;
  return {
    logoImageUrl: content.logoImageUrl,
    logoText: content.logoText ?? "",
    items: content.items ?? [],
  };
}

function newItem(order: number): NavigationItem {
  return { id: crypto.randomUUID(), label: EMPTY_TEXT, href: "/", visible: true, order };
}

/**
 * Content Management → Navigation editor (Sprint 8.3) — the public site's
 * header logo + nav links, feeding `apps/web/src/components/SiteHeader.tsx`.
 * When this content area has never been published, the public site keeps
 * its exact hardcoded 5-link nav — see `useNavigationContent`'s fallback.
 */
export function NavigationContentPage() {
  const { toast } = useToast();
  const { session } = useAuth();
  const area = useSingletonContentArea<NavigationContent>("navigation");
  const [form, setForm] = useState<NavigationForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    if (!hydrated && area.draft !== undefined) {
      setForm(toForm(area.draft));
      setHydrated(true);
    }
  }, [area.draft, hydrated]);

  async function handleLogoUpload(file: File) {
    setUploading(true);
    try {
      const item = await uploadAndCatalogSiteMedia(
        adminFirestore,
        "logos",
        session?.uid ?? "",
        file,
      );
      setForm((prev) => ({ ...prev, logoImageUrl: item.url }));
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, newItem(prev.items.length)] }));
  }

  function updateItem(id: string, patch: Partial<NavigationItem>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function removeItem(id: string) {
    setForm((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setForm((prev) => {
      const oldIndex = prev.items.findIndex((item) => item.id === active.id);
      const newIndex = prev.items.findIndex((item) => item.id === over.id);
      return {
        ...prev,
        items: arrayMove(prev.items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index,
        })),
      };
    });
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
      toast({ variant: "success", title: "Navigation published" });
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
        <Heading level={2}>Navigation</Heading>
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

      <HistoryPanel area="navigation" onRestore={handleRestore} />

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
            Logo image
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            aria-label="Logo image"
            className="text-sm"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleLogoUpload(file);
            }}
          />
          {form.logoImageUrl && (
            <img src={form.logoImageUrl} alt="" className="h-12 w-auto rounded-lg object-contain" />
          )}
        </div>
        <Input
          label="Logo text"
          value={form.logoText ?? ""}
          onChange={(e) => setForm({ ...form, logoText: e.target.value })}
          placeholder="Clayba"
        />
      </div>

      <div className="flex items-center justify-between">
        <Heading level={3}>Nav links</Heading>
        <Button size="sm" variant="outline" onClick={addItem}>
          Add link
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={form.items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-3">
            {form.items.map((item) => (
              <SortableNavRow
                key={item.id}
                item={item}
                onUpdate={(patch) => updateItem(item.id, patch)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableNavRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: NavigationItem;
  onUpdate: (patch: Partial<NavigationItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Reorder link"
          className="cursor-grab text-neutral-400 hover:text-neutral-600 active:cursor-grabbing dark:hover:text-neutral-300"
        >
          <Icon name="chevronsUpDown" size={18} />
        </button>
        <Input
          label="URL"
          value={item.href}
          onChange={(e) => onUpdate({ href: e.target.value })}
          className="max-w-[220px]"
        />
        <Switch
          label="Visible"
          checked={item.visible}
          onCheckedChange={(checked) => onUpdate({ visible: checked })}
        />
        <Button size="sm" variant="destructive" className="ml-auto" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <BilingualTextField
        label="Label"
        value={item.label}
        onChange={(label) => onUpdate({ label })}
      />
    </li>
  );
}
