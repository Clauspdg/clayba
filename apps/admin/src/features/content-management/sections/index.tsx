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
  Badge,
  Button,
  ErrorState,
  Heading,
  Icon,
  LoadingState,
  Switch,
  useToast,
} from "@the-ride/ui";
import {
  DEFAULT_SECTIONS_CONFIG,
  type SectionConfig,
  type SectionKey,
  type SectionsContent,
} from "@the-ride/types";
import { useEffect, useState } from "react";

import { PublishBar } from "../shared/PublishBar";
import { useSingletonContentArea } from "../shared/useSingletonContentArea";

const SECTION_LABELS: Record<SectionKey, string> = {
  stats: "Statistics",
  vehicleTypes: "Vehicle categories",
  mapPreview: "Live GPS preview",
  howItWorks: "How it works",
  safety: "Safety",
  testimonials: "Testimonials",
  mobileApp: "Mobile app download",
  driverCta: "Driver call-to-action",
};

function sortedItems(items: SectionConfig[]): SectionConfig[] {
  return [...items].sort((a, b) => a.order - b.order);
}

/**
 * Content Management → Sections (Sprint 7.1 Site Content CMS) — enable,
 * disable, and drag-reorder the eight toggleable sections that follow the
 * Hero on the public homepage. Renaming isn't supported: each section's own
 * heading is either a static label or (for sections with a dedicated
 * editor) owned by that editor, not a generic override here.
 */
export function SectionsContentPage() {
  const { toast } = useToast();
  const area = useSingletonContentArea<SectionsContent>("sections");
  const [items, setItems] = useState<SectionConfig[]>(DEFAULT_SECTIONS_CONFIG);
  const [hydrated, setHydrated] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    if (!hydrated && area.draft !== undefined) {
      setItems(sortedItems(area.draft?.items ?? DEFAULT_SECTIONS_CONFIG));
      setHydrated(true);
    }
  }, [area.draft, hydrated]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.key === active.id);
    const newIndex = items.findIndex((item) => item.key === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order: index,
    }));
    setItems(reordered);
  }

  function toggleEnabled(key: SectionKey, enabled: boolean) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, enabled } : item)));
  }

  async function handleSave() {
    try {
      await area.save({ items });
      toast({ variant: "success", title: "Draft saved" });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Save failed" });
    }
  }

  async function handlePublish() {
    try {
      await area.publish();
      toast({ variant: "success", title: "Sections published" });
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
        <Heading level={2}>Sections</Heading>
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={items.map((item) => item.key)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <SortableSectionRow key={item.key} item={item} onToggle={toggleEnabled} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableSectionRow({
  item,
  onToggle,
}: {
  item: SectionConfig;
  onToggle: (key: SectionKey, enabled: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.key,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${SECTION_LABELS[item.key]}`}
          className="cursor-grab text-neutral-400 hover:text-neutral-600 active:cursor-grabbing dark:hover:text-neutral-300"
        >
          <Icon name="chevronsUpDown" size={18} />
        </button>
        <span className="font-medium text-neutral-900 dark:text-neutral-50">
          {SECTION_LABELS[item.key]}
        </span>
        {!item.enabled && <Badge tone="neutral">Hidden</Badge>}
      </div>
      <Switch
        label="Visible"
        checked={item.enabled}
        onCheckedChange={(checked) => onToggle(item.key, checked)}
      />
    </li>
  );
}
