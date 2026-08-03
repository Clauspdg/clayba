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
  Input,
  LoadingState,
  useToast,
} from "@the-ride/ui";
import type { BilingualText, TrackingContent, TrackingPoint } from "@the-ride/types";
import { useEffect, useState } from "react";

import { BilingualTextField } from "../shared/BilingualTextField";
import { HistoryPanel } from "../shared/HistoryPanel";
import { PublishBar } from "../shared/PublishBar";
import { useSingletonContentArea } from "../shared/useSingletonContentArea";

const EMPTY_TEXT: BilingualText = { fr: "", en: "" };

interface TrackingForm {
  eyebrow: BilingualText;
  title: BilingualText;
  subtitle: BilingualText;
  distanceValue: string;
  etaValue: string;
  points: TrackingPoint[];
}

const EMPTY_FORM: TrackingForm = {
  eyebrow: EMPTY_TEXT,
  title: EMPTY_TEXT,
  subtitle: EMPTY_TEXT,
  distanceValue: "12.4 km",
  etaValue: "18 min",
  points: [],
};

function toForm(content: TrackingContent | null | undefined): TrackingForm {
  if (!content) return EMPTY_FORM;
  return {
    eyebrow: content.eyebrow ?? EMPTY_TEXT,
    title: content.title ?? EMPTY_TEXT,
    subtitle: content.subtitle ?? EMPTY_TEXT,
    distanceValue: content.distanceValue ?? "12.4 km",
    etaValue: content.etaValue ?? "18 min",
    points: content.points ?? [],
  };
}

function newPoint(order: number): TrackingPoint {
  return { id: crypto.randomUUID(), text: EMPTY_TEXT, order };
}

/**
 * Content Management → Tracking editor (Sprint 8.3) — the GPS/live-
 * tracking section. `distanceValue`/`etaValue` stay simulated strings (no
 * real Maps API in this environment — see
 * `apps/web/src/components/marketing/MapPreview.tsx`'s own disclosure),
 * now editable instead of hardcoded.
 */
export function TrackingContentPage() {
  const { toast } = useToast();
  const area = useSingletonContentArea<TrackingContent>("tracking");
  const [form, setForm] = useState<TrackingForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    if (!hydrated && area.draft !== undefined) {
      setForm(toForm(area.draft));
      setHydrated(true);
    }
  }, [area.draft, hydrated]);

  function addPoint() {
    setForm((prev) => ({ ...prev, points: [...prev.points, newPoint(prev.points.length)] }));
  }

  function updatePoint(id: string, patch: Partial<TrackingPoint>) {
    setForm((prev) => ({
      ...prev,
      points: prev.points.map((point) => (point.id === id ? { ...point, ...patch } : point)),
    }));
  }

  function removePoint(id: string) {
    setForm((prev) => ({ ...prev, points: prev.points.filter((point) => point.id !== id) }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setForm((prev) => {
      const oldIndex = prev.points.findIndex((point) => point.id === active.id);
      const newIndex = prev.points.findIndex((point) => point.id === over.id);
      return {
        ...prev,
        points: arrayMove(prev.points, oldIndex, newIndex).map((point, index) => ({
          ...point,
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
      toast({ variant: "success", title: "Tracking section published" });
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
        <Heading level={2}>Tracking</Heading>
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

      <HistoryPanel area="tracking" onRestore={handleRestore} />

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
        <Badge tone="neutral" className="self-start">
          Distance/ETA are simulated illustrative values — no real Maps API in this environment
        </Badge>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Distance value"
            value={form.distanceValue}
            onChange={(e) => setForm({ ...form, distanceValue: e.target.value })}
          />
          <Input
            label="ETA value"
            value={form.etaValue}
            onChange={(e) => setForm({ ...form, etaValue: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Heading level={3}>Advantages list</Heading>
        <Button size="sm" variant="outline" onClick={addPoint}>
          Add point
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={form.points.map((point) => point.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-2">
            {form.points.map((point) => (
              <SortablePointRow
                key={point.id}
                point={point}
                onUpdate={(patch) => updatePoint(point.id, patch)}
                onRemove={() => removePoint(point.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortablePointRow({
  point,
  onUpdate,
  onRemove,
}: {
  point: TrackingPoint;
  onUpdate: (patch: Partial<TrackingPoint>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: point.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 ${isDragging ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Reorder point"
        className="mb-3 cursor-grab text-neutral-400 hover:text-neutral-600 active:cursor-grabbing dark:hover:text-neutral-300"
      >
        <Icon name="chevronsUpDown" size={18} />
      </button>
      <div className="flex-1">
        <BilingualTextField
          label="Advantage"
          value={point.text}
          onChange={(text) => onUpdate({ text })}
        />
      </div>
      <Button size="sm" variant="destructive" onClick={onRemove}>
        Remove
      </Button>
    </li>
  );
}
