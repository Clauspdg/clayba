"use client";

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
import type { BilingualText, SafetyCard, SafetyContent } from "@the-ride/types";
import { useEffect, useState } from "react";

import { BilingualTextField } from "../shared/BilingualTextField";
import { HistoryPanel } from "../shared/HistoryPanel";
import { PublishBar } from "../shared/PublishBar";
import { useSingletonContentArea } from "../shared/useSingletonContentArea";

const EMPTY_TEXT: BilingualText = { fr: "", en: "" };

interface SafetyForm {
  eyebrow: BilingualText;
  title: BilingualText;
  subtitle: BilingualText;
  ctaLabel: BilingualText;
  ctaHref: string;
  items: SafetyCard[];
}

const EMPTY_FORM: SafetyForm = {
  eyebrow: EMPTY_TEXT,
  title: EMPTY_TEXT,
  subtitle: EMPTY_TEXT,
  ctaLabel: EMPTY_TEXT,
  ctaHref: "/safety",
  items: [],
};

function toForm(content: SafetyContent | null | undefined): SafetyForm {
  if (!content) return EMPTY_FORM;
  return {
    eyebrow: content.eyebrow ?? EMPTY_TEXT,
    title: content.title ?? EMPTY_TEXT,
    subtitle: content.subtitle ?? EMPTY_TEXT,
    ctaLabel: content.ctaLabel ?? EMPTY_TEXT,
    ctaHref: content.ctaHref ?? "/safety",
    items: content.items ?? [],
  };
}

function newCard(order: number): SafetyCard {
  return {
    id: crypto.randomUUID(),
    icon: "shieldCheck",
    title: EMPTY_TEXT,
    description: EMPTY_TEXT,
    badgeText: EMPTY_TEXT,
    order,
  };
}

/**
 * Content Management → Safety editor (Sprint 7.2 Site Content CMS) — the
 * Safety section's cards plus its single CTA, feeding the inline safety
 * section in `apps/web/src/app/page.tsx`.
 */
export function SafetyContentPage() {
  const { toast } = useToast();
  const area = useSingletonContentArea<SafetyContent>("safety");
  const [form, setForm] = useState<SafetyForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    if (!hydrated && area.draft !== undefined) {
      setForm(toForm(area.draft));
      setHydrated(true);
    }
  }, [area.draft, hydrated]);

  function addCard() {
    setForm((prev) => ({ ...prev, items: [...prev.items, newCard(prev.items.length)] }));
  }

  function updateCard(id: string, patch: Partial<SafetyCard>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((card) => (card.id === id ? { ...card, ...patch } : card)),
    }));
  }

  function removeCard(id: string) {
    setForm((prev) => ({ ...prev, items: prev.items.filter((card) => card.id !== id) }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setForm((prev) => {
      const oldIndex = prev.items.findIndex((card) => card.id === active.id);
      const newIndex = prev.items.findIndex((card) => card.id === over.id);
      return {
        ...prev,
        items: arrayMove(prev.items, oldIndex, newIndex).map((card, index) => ({
          ...card,
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
      toast({ variant: "success", title: "Safety published" });
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
        <Heading level={2}>Safety</Heading>
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

      <HistoryPanel area="safety" onRestore={handleRestore} />

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
        <div className="grid grid-cols-[1fr_240px] items-end gap-4">
          <BilingualTextField
            label="CTA button label"
            value={form.ctaLabel}
            onChange={(ctaLabel) => setForm({ ...form, ctaLabel })}
          />
          <Input
            label="CTA link"
            value={form.ctaHref}
            onChange={(e) => setForm({ ...form, ctaHref: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Heading level={3}>Cards</Heading>
        <Button size="sm" variant="outline" onClick={addCard}>
          Add card
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={form.items.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-3">
            {form.items.map((card) => (
              <SortableCardRow
                key={card.id}
                card={card}
                onUpdate={(patch) => updateCard(card.id, patch)}
                onRemove={() => removeCard(card.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableCardRow({
  card,
  onUpdate,
  onRemove,
}: {
  card: SafetyCard;
  onUpdate: (patch: Partial<SafetyCard>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
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
          aria-label="Reorder card"
          className="cursor-grab text-neutral-400 hover:text-neutral-600 active:cursor-grabbing dark:hover:text-neutral-300"
        >
          <Icon name="chevronsUpDown" size={18} />
        </button>
        <Icon name={card.icon as IconName} size={20} className="text-brand shrink-0" />
        <Input
          label="Icon key"
          value={card.icon}
          onChange={(e) => onUpdate({ icon: e.target.value })}
          className="max-w-[160px]"
        />
        <Button size="sm" variant="destructive" className="ml-auto" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <BilingualTextField
        label="Title"
        value={card.title}
        onChange={(title) => onUpdate({ title })}
      />
      <BilingualTextField
        label="Description"
        value={card.description}
        onChange={(description) => onUpdate({ description })}
        multiline
        rows={2}
      />
      <BilingualTextField
        label="Badge text"
        value={card.badgeText}
        onChange={(badgeText) => onUpdate({ badgeText })}
      />
    </li>
  );
}
