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
import { Button, ErrorState, Heading, Icon, Input, LoadingState, useToast } from "@the-ride/ui";
import type { BilingualText, StatisticItem, StatisticsContent } from "@the-ride/types";
import { useEffect, useState } from "react";

import { BilingualTextField } from "../shared/BilingualTextField";
import { HistoryPanel } from "../shared/HistoryPanel";
import { PublishBar } from "../shared/PublishBar";
import { useSingletonContentArea } from "../shared/useSingletonContentArea";

const EMPTY_TEXT: BilingualText = { fr: "", en: "" };

interface StatisticsForm {
  items: StatisticItem[];
}

const EMPTY_FORM: StatisticsForm = { items: [] };

function toForm(content: StatisticsContent | null | undefined): StatisticsForm {
  if (!content) return EMPTY_FORM;
  return { items: content.items ?? [] };
}

function newItem(order: number): StatisticItem {
  return { id: crypto.randomUUID(), value: "", label: EMPTY_TEXT, order };
}

/**
 * Content Management → Statistics editor (Sprint 8.3) — the four homepage
 * stat callouts ("250K+" etc.), feeding
 * `apps/web/src/components/marketing/StatsSection.tsx`. Same singleton +
 * reorderable-array pattern as Sections/How It Works.
 */
export function StatisticsContentPage() {
  const { toast } = useToast();
  const area = useSingletonContentArea<StatisticsContent>("statistics");
  const [form, setForm] = useState<StatisticsForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    if (!hydrated && area.draft !== undefined) {
      setForm(toForm(area.draft));
      setHydrated(true);
    }
  }, [area.draft, hydrated]);

  function addItem() {
    setForm((prev) => ({ items: [...prev.items, newItem(prev.items.length)] }));
  }

  function updateItem(id: string, patch: Partial<StatisticItem>) {
    setForm((prev) => ({
      items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function removeItem(id: string) {
    setForm((prev) => ({ items: prev.items.filter((item) => item.id !== id) }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setForm((prev) => {
      const oldIndex = prev.items.findIndex((item) => item.id === active.id);
      const newIndex = prev.items.findIndex((item) => item.id === over.id);
      return {
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
      toast({ variant: "success", title: "Statistics published" });
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
        <Heading level={2}>Statistics</Heading>
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

      <HistoryPanel area="statistics" onRestore={handleRestore} />

      <div className="flex items-center justify-between">
        <Heading level={3}>Stat callouts</Heading>
        <Button size="sm" variant="outline" onClick={addItem}>
          Add stat
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={form.items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-3">
            {form.items.map((item) => (
              <SortableStatRow
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

function SortableStatRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: StatisticItem;
  onUpdate: (patch: Partial<StatisticItem>) => void;
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
          aria-label="Reorder stat"
          className="cursor-grab text-neutral-400 hover:text-neutral-600 active:cursor-grabbing dark:hover:text-neutral-300"
        >
          <Icon name="chevronsUpDown" size={18} />
        </button>
        <Input
          label="Value"
          value={item.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          className="max-w-[160px]"
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
