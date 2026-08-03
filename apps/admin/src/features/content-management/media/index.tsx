"use client";

import { adminFirestore } from "@/lib/firebase-client";
import {
  deleteSiteMediaItem,
  subscribeSiteMedia,
  uploadAndCatalogSiteMedia,
} from "@/lib/site-media-admin";
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
  Illustration,
  LoadingState,
  SearchBar,
  Select,
  useToast,
} from "@the-ride/ui";
import type { SiteMediaCategory, SiteMediaItem } from "@the-ride/types";
import { useEffect, useMemo, useState } from "react";

const CATEGORY_OPTIONS: { value: SiteMediaCategory; label: string }[] = [
  { value: "hero", label: "Hero" },
  { value: "sections", label: "Sections" },
  { value: "testimonials", label: "Testimonials" },
  { value: "downloads", label: "Downloads" },
  { value: "logos", label: "Logos" },
  { value: "videos", label: "Videos" },
  { value: "backgrounds", label: "Backgrounds" },
  { value: "vehicles", label: "Vehicles" },
];

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All categories" },
  ...CATEGORY_OPTIONS,
];

/**
 * Content Management → Media Library. Sprint 7.1 shipped a simple catalog
 * (upload, list, delete, copy URL); Sprint 8.3 adds a filename search and a
 * display-category filter (distinct from the upload-category picker below,
 * which stays as-is) and fixes a found bug — `"vehicles"` was a valid
 * `SiteMediaCategory` missing from this UI's category dropdown. No
 * "replace in place" yet — an admin re-uploads instead of editing an
 * existing item.
 */
export function MediaLibraryPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<SiteMediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<SiteMediaCategory>("sections");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<SiteMediaItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => subscribeSiteMedia(adminFirestore, setItems, setError), []);

  const filteredItems = useMemo(() => {
    if (!items) return items;
    return items.filter((item) => {
      const matchesCategory = filterCategory === "all" || item.category === filterCategory;
      const matchesSearch = item.fileName.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, filterCategory, search]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      await uploadAndCatalogSiteMedia(adminFirestore, category, session?.uid ?? "", file);
      toast({ variant: "success", title: "Uploaded" });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteSiteMediaItem(adminFirestore, deleting);
      toast({ variant: "success", title: "Deleted" });
      setDeleting(null);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : "Delete failed" });
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    toast({ variant: "success", title: "URL copied" });
  }

  if (error) return <ErrorState title="Something went wrong" description={error} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={2}>Media Library</Heading>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <Select
          label="Upload category"
          value={category}
          onValueChange={(value) => setCategory(value as SiteMediaCategory)}
          options={CATEGORY_OPTIONS}
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Upload</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4"
            aria-label="Upload media"
            className="text-sm"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <SearchBar
          label="Search"
          placeholder="Search by filename…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          label="Filter by category"
          value={filterCategory}
          onValueChange={setFilterCategory}
          options={FILTER_OPTIONS}
        />
      </div>

      {items === null ? (
        <LoadingState title="Loading…" />
      ) : items.length === 0 ? (
        <EmptyState icon={<Illustration name="empty" size={80} />} title="No media uploaded yet" />
      ) : filteredItems && filteredItems.length === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title="No media matches your search"
        />
      ) : (
        <div className="tablet:grid-cols-3 laptop:grid-cols-4 grid grid-cols-2 gap-4">
          {(filteredItems ?? []).map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              {item.contentKind === "video" ? (
                <video src={item.url} className="h-32 w-full rounded-lg object-cover" muted />
              ) : (
                <img
                  src={item.url}
                  alt={item.fileName}
                  className="h-32 w-full rounded-lg object-cover"
                />
              )}
              <div className="flex items-center justify-between gap-2">
                <Badge tone="neutral">{item.category}</Badge>
                <Badge tone="neutral">{(item.sizeBytes / 1024 / 1024).toFixed(1)} MB</Badge>
              </div>
              <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                {item.fileName}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => void handleCopyUrl(item.url)}
                >
                  Copy URL
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleting(item)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent closeLabel="Close">
          <DialogHeader>
            <DialogTitle>Delete this media item?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            This removes the file from Storage. If it's still referenced by any published content,
            that reference will break.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} isLoading={busy}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
