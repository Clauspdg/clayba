import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
} from "@the-ride/ui";
import type { CreateFaqItemInput, FaqCategory } from "@the-ride/types";
import { useState } from "react";

import { BilingualTextField } from "../shared/BilingualTextField";

const CATEGORY_OPTIONS: { value: FaqCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "booking", label: "Booking" },
  { value: "payments", label: "Payments" },
  { value: "safety", label: "Safety" },
  { value: "drivers", label: "Drivers" },
];

export interface FaqFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: CreateFaqItemInput;
  onSave: (input: CreateFaqItemInput) => Promise<void>;
  title: string;
}

/** Parent must pass a `key` that changes per distinct item being edited so this component remounts on switch — see `TestimonialFormDialog`'s comment for why. */
export function FaqFormDialog({
  open,
  onOpenChange,
  initialValue,
  onSave,
  title,
}: FaqFormDialogProps) {
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
          <Select
            label="Category"
            value={form.category}
            onValueChange={(value) => setForm({ ...form, category: value as FaqCategory })}
            options={CATEGORY_OPTIONS}
          />
          <BilingualTextField
            label="Question"
            value={form.question}
            onChange={(question) => setForm({ ...form, question })}
          />
          <BilingualTextField
            label="Answer"
            value={form.answer}
            onChange={(answer) => setForm({ ...form, answer })}
            multiline
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            isLoading={saving}
            disabled={!form.question.en.trim() && !form.question.fr.trim()}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
