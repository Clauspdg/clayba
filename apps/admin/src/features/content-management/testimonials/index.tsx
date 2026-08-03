"use client";

import { adminFirestore } from "@/lib/firebase-client";
import {
  createTestimonialDraft,
  deleteTestimonialDraft,
  discardTestimonialsDraft,
  publishTestimonials,
  reorderTestimonialsDraft,
  restoreTestimonialsFromHistory,
  subscribeTestimonialsDraft,
  subscribeTestimonialsPublished,
  toCreateTestimonialInput,
  updateTestimonialDraft,
} from "@/lib/site-testimonials-admin";
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
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  Heading,
  Icon,
  Illustration,
  LoadingState,
  useToast,
} from "@the-ride/ui";
import type { CreateTestimonialItemInput, TestimonialItem } from "@the-ride/types";
import { useCallback, useState } from "react";

import { HistoryPanel } from "../shared/HistoryPanel";
import { PublishBar } from "../shared/PublishBar";
import { useListContentArea } from "../shared/useListContentArea";
import { TestimonialFormDialog } from "./TestimonialFormDialog";

const EMPTY_INPUT: CreateTestimonialItemInput = {
  name: "",
  role: { fr: "", en: "" },
  city: "",
  trips: 0,
  quote: { fr: "", en: "" },
  rating: 5,
  order: 0,
};

export function TestimonialsCmsPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const uid = session?.uid ?? "";

  const subscribeDraft = useCallback(
    (onNext: (items: TestimonialItem[]) => void, onError: (m: string) => void) =>
      subscribeTestimonialsDraft(adminFirestore, onNext, onError),
    [],
  );
  const subscribePublished = useCallback(
    (onNext: (items: TestimonialItem[]) => void, onError: (m: string) => void) =>
      subscribeTestimonialsPublished(adminFirestore, onNext, onError),
    [],
  );

  const area = useListContentArea<TestimonialItem>({
    subscribeDraft,
    subscribePublished,
    publish: (publishedBy, publishedByEmail) =>
      publishTestimonials(adminFirestore, publishedBy, publishedByEmail),
    discardDraft: (updatedBy) => discardTestimonialsDraft(adminFirestore, updatedBy),
    restoreFromHistory: (snapshot, updatedBy) =>
      restoreTestimonialsFromHistory(adminFirestore, snapshot, updatedBy),
  });

  const [editing, setEditing] = useState<TestimonialItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<TestimonialItem | null>(null);
  const [busy, setBusy] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const items = area.draftItems ?? [];

  async function handleSave(input: CreateTestimonialItemInput) {
    if (editing === "new") {
      await createTestimonialDraft(adminFirestore, uid, { ...input, order: items.length });
      toast({ variant: "success", title: "Testimonial added to draft" });
    } else if (editing) {
      await updateTestimonialDraft(adminFirestore, editing.id, uid, input);
      toast({ variant: "success", title: "Testimonial updated in draft" });
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteTestimonialDraft(adminFirestore, deleting.id);
      toast({ variant: "success", title: "Removed from draft" });
      setDeleting(null);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Delete failed" });
    } finally {
      setBusy(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    void reorderTestimonialsDraft(
      adminFirestore,
      reordered.map((item) => item.id),
    );
  }

  async function handlePublish() {
    try {
      await area.publish();
      toast({ variant: "success", title: "Testimonials published" });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Publish failed" });
    }
  }

  async function handleDiscard() {
    try {
      await area.discardDraft();
      toast({ variant: "success", title: "Draft reverted to published version" });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Discard failed" });
    }
  }

  async function handleRestore(snapshot: Record<string, unknown> | Record<string, unknown>[]) {
    try {
      await area.restoreFromHistory(snapshot as Record<string, unknown>[]);
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
        <Heading level={2}>Testimonials</Heading>
        <Button onClick={() => setEditing("new")}>Add testimonial</Button>
      </div>

      <PublishBar
        hasUnpublishedChanges={area.hasUnpublishedChanges}
        publishedAt={area.publishedAt}
        isPublishing={area.publishing}
        isDiscarding={area.discarding}
        onPublish={() => void handlePublish()}
        onDiscardDraft={() => void handleDiscard()}
      />

      <HistoryPanel area="testimonials" onRestore={handleRestore} />

      {items.length === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title="No testimonials in the draft yet"
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <SortableTestimonialRow
                  key={item.id}
                  item={item}
                  onEdit={() => setEditing(item)}
                  onDelete={() => setDeleting(item)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {editing && (
        <TestimonialFormDialog
          key={editing === "new" ? "new" : editing.id}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
          initialValue={editing === "new" ? EMPTY_INPUT : toCreateTestimonialInput(editing)}
          onSave={handleSave}
          title={editing === "new" ? "Add testimonial" : "Edit testimonial"}
        />
      )}

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent closeLabel="Close">
          <DialogHeader>
            <DialogTitle>Remove this testimonial from the draft?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} isLoading={busy}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortableTestimonialRow({
  item,
  onEdit,
  onDelete,
}: {
  item: TestimonialItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
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
          aria-label={`Reorder ${item.name}`}
          className="cursor-grab text-neutral-400 hover:text-neutral-600 active:cursor-grabbing dark:hover:text-neutral-300"
        >
          <Icon name="chevronsUpDown" size={18} />
        </button>
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-50">{item.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {item.city} · {item.trips}+ trips · <Badge tone="neutral">{item.rating}★</Badge>
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  );
}
