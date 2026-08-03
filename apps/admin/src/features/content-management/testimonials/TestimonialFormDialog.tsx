import { adminFirestore } from "@/lib/firebase-client";
import { uploadAndCatalogSiteMedia } from "@/lib/site-media-admin";
import { useAuth } from "@the-ride/hooks";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Switch,
  useToast,
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
  const { session } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function handlePhotoUpload(file: File) {
    setUploadingPhoto(true);
    try {
      const item = await uploadAndCatalogSiteMedia(
        adminFirestore,
        "testimonials",
        session?.uid ?? "",
        file,
      );
      setForm((prev) => ({ ...prev, photoUrl: item.url }));
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploadingPhoto(false);
    }
  }

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
          <Switch
            label="Active (shown on the public site)"
            checked={form.active}
            onCheckedChange={(active) => setForm({ ...form, active })}
          />
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
          <Input
            label="Country (optional)"
            value={form.country ?? ""}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              Photo (optional)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Testimonial photo"
              className="text-sm"
              disabled={uploadingPhoto}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handlePhotoUpload(file);
              }}
            />
            {form.photoUrl && (
              <img src={form.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            )}
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
