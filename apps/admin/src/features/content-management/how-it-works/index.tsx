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
  useToast,
  type IconName,
} from "@the-ride/ui";
import type { BilingualText, HowItWorksContent, HowItWorksStep } from "@the-ride/types";
import { useEffect, useState } from "react";

import { BilingualTextField } from "../shared/BilingualTextField";
import { HistoryPanel } from "../shared/HistoryPanel";
import { PublishBar } from "../shared/PublishBar";
import { useSingletonContentArea } from "../shared/useSingletonContentArea";

const EMPTY_TEXT: BilingualText = { fr: "", en: "" };

interface HowItWorksForm {
  eyebrow: BilingualText;
  title: BilingualText;
  items: HowItWorksStep[];
}

const EMPTY_FORM: HowItWorksForm = { eyebrow: EMPTY_TEXT, title: EMPTY_TEXT, items: [] };

function toForm(content: HowItWorksContent | null | undefined): HowItWorksForm {
  if (!content) return EMPTY_FORM;
  return {
    eyebrow: content.eyebrow ?? EMPTY_TEXT,
    title: content.title ?? EMPTY_TEXT,
    items: content.items ?? [],
  };
}

function newStep(order: number): HowItWorksStep {
  return {
    id: crypto.randomUUID(),
    icon: "mapPin",
    title: EMPTY_TEXT,
    description: EMPTY_TEXT,
    order,
  };
}

/**
 * Content Management → How It Works editor (Sprint 7.2 Site Content CMS) —
 * a dynamic, reorderable step list feeding
 * `apps/web/src/components/marketing/ProcessSteps.tsx`. Same singleton
 * draft/publish/discard/restore plumbing as every other editor; the array
 * itself is edited locally and saved as a whole via `area.save(form)`.
 */
export function HowItWorksContentPage() {
  const { toast } = useToast();
  const { session } = useAuth();
  const area = useSingletonContentArea<HowItWorksContent>("howItWorks");
  const [form, setForm] = useState<HowItWorksForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    if (!hydrated && area.draft !== undefined) {
      setForm(toForm(area.draft));
      setHydrated(true);
    }
  }, [area.draft, hydrated]);

  function addStep() {
    setForm((prev) => ({ ...prev, items: [...prev.items, newStep(prev.items.length)] }));
  }

  function updateStep(id: string, patch: Partial<HowItWorksStep>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    }));
  }

  function removeStep(id: string) {
    setForm((prev) => ({ ...prev, items: prev.items.filter((step) => step.id !== id) }));
  }

  async function handleImageUpload(id: string, file: File) {
    setUploadingStepId(id);
    try {
      const item = await uploadAndCatalogSiteMedia(
        adminFirestore,
        "sections",
        session?.uid ?? "",
        file,
      );
      updateStep(id, { imageUrl: item.url });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploadingStepId(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setForm((prev) => {
      const oldIndex = prev.items.findIndex((step) => step.id === active.id);
      const newIndex = prev.items.findIndex((step) => step.id === over.id);
      return {
        ...prev,
        items: arrayMove(prev.items, oldIndex, newIndex).map((step, index) => ({
          ...step,
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
      toast({ variant: "success", title: "How It Works published" });
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
        <Heading level={2}>How It Works</Heading>
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

      <HistoryPanel area="howItWorks" onRestore={handleRestore} />

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
      </div>

      <div className="flex items-center justify-between">
        <Heading level={3}>Steps</Heading>
        <Button size="sm" variant="outline" onClick={addStep}>
          Add step
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={form.items.map((step) => step.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-3">
            {form.items.map((step) => (
              <SortableStepRow
                key={step.id}
                step={step}
                onUpdate={(patch) => updateStep(step.id, patch)}
                onRemove={() => removeStep(step.id)}
                onImageUpload={(file) => void handleImageUpload(step.id, file)}
                uploading={uploadingStepId === step.id}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableStepRow({
  step,
  onUpdate,
  onRemove,
  onImageUpload,
  uploading,
}: {
  step: HowItWorksStep;
  onUpdate: (patch: Partial<HowItWorksStep>) => void;
  onRemove: () => void;
  onImageUpload: (file: File) => void;
  uploading: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
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
          aria-label="Reorder step"
          className="cursor-grab text-neutral-400 hover:text-neutral-600 active:cursor-grabbing dark:hover:text-neutral-300"
        >
          <Icon name="chevronsUpDown" size={18} />
        </button>
        <Icon name={step.icon as IconName} size={20} className="text-brand shrink-0" />
        <Input
          label="Icon key"
          value={step.icon}
          onChange={(e) => onUpdate({ icon: e.target.value })}
          className="max-w-[160px]"
        />
        <Button size="sm" variant="destructive" className="ml-auto" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <BilingualTextField
        label="Title"
        value={step.title}
        onChange={(title) => onUpdate({ title })}
      />
      <BilingualTextField
        label="Description"
        value={step.description}
        onChange={(description) => onUpdate({ description })}
        multiline
        rows={2}
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
          Image (optional)
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Step image"
          className="text-sm"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageUpload(file);
          }}
        />
        {step.imageUrl && (
          <img src={step.imageUrl} alt="" className="h-20 w-32 rounded-lg object-cover" />
        )}
      </div>
    </li>
  );
}
