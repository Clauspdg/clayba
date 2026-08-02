import { Badge, Button } from "@the-ride/ui";

export interface PublishBarProps {
  hasUnpublishedChanges: boolean;
  publishedAt?: Date;
  isPublishing?: boolean;
  isDiscarding?: boolean;
  onPublish: () => void;
  onDiscardDraft: () => void;
}

/**
 * Shared draft-state banner + Publish/Discard controls (Sprint 7.1 Site
 * Content CMS) — one component reused by every content area's editor page.
 * `hasUnpublishedChanges` is computed by the caller (the
 * `useSingletonContentArea`/`useListContentArea` hooks) by diffing the
 * already-subscribed draft vs. published data — no extra reads happen here.
 */
export function PublishBar({
  hasUnpublishedChanges,
  publishedAt,
  isPublishing,
  isDiscarding,
  onPublish,
  onDiscardDraft,
}: PublishBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col gap-0.5">
        <Badge tone={hasUnpublishedChanges ? "warning" : "success"}>
          {hasUnpublishedChanges ? "Draft changes pending" : "Up to date"}
        </Badge>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {publishedAt ? `Last published ${publishedAt.toLocaleString()}` : "Never published"}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDiscardDraft}
          disabled={!hasUnpublishedChanges || isDiscarding}
          isLoading={isDiscarding}
        >
          Discard draft
        </Button>
        <Button
          size="sm"
          onClick={onPublish}
          disabled={!hasUnpublishedChanges || isPublishing}
          isLoading={isPublishing}
        >
          Publish changes
        </Button>
      </div>
    </div>
  );
}
