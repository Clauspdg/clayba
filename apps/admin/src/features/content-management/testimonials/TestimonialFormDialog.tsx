import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@the-ride/ui";
import type { CreateTestimonialItemInput } from "@the-ride/types";
import { useState } from "react";

import { BilingualTextField } from "../shared/BilingualTextField";

export interface TestimonialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: CreateTestimonialItemInput;
  onSave: (input: CreateTestimonialItemInput) => Promise<void>;
  title: string;
}

/** Parent must pass a `key` that changes per distinct item being edited (e.g. `editing.id ?? "new"`) so this component remounts — and its local form state resets — instead of showing stale data when switching items. */
export function TestimonialFormDialog({
  open,
  onOpenChange,
  initialValue,
  onSave,
  title,
}: TestimonialFormDialogProps) {
  const [form, setForm] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Close">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <BilingualTextField
            label="Role"
            value={form.role}
            onChange={(role) => setForm({ ...form, role })}
          />
          <BilingualTextField
            label="Quote"
            value={form.quote}
            onChange={(quote) => setForm({ ...form, quote })}
            multiline
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              min={0}
              label="Trips"
              value={form.trips}
              onChange={(e) => setForm({ ...form, trips: Number(e.target.value) })}
            />
            <Input
              type="number"
              min={1}
              max={5}
              label="Rating (1-5)"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} isLoading={saving} disabled={!form.name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
