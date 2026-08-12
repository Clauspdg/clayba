"use client";

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  Icon,
  IconButton,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { DocumentReviewStatus } from "@the-ride/types";
import { useState } from "react";

export interface ReviewDocument {
  /** `DriverDocumentType` value — also the review map key. */
  key: string;
  label: string;
  url?: string;
  uploadedAt?: Date;
  expiresAt?: Date;
  reviewStatus?: DocumentReviewStatus;
}

const STATUS_TONE: Record<DocumentReviewStatus, "neutral" | "success" | "warning" | "danger"> = {
  [DocumentReviewStatus.PENDING]: "neutral",
  [DocumentReviewStatus.VALID]: "success",
  [DocumentReviewStatus.REJECTED]: "danger",
  [DocumentReviewStatus.REPLACEMENT_REQUIRED]: "warning",
  [DocumentReviewStatus.EXPIRED]: "danger",
};

/**
 * Admin Driver Application Review Workspace sprint, Part 11 — one shared
 * thumbnail-grid + full-size lightbox for every document surface (license,
 * insurance, profile photo). A document's `url` is a Firebase Storage
 * download-token URL already stored on the application (see
 * `docs/driver-management.md`'s "Storage access" note added this sprint
 * for the full security implication) — this component just renders it, it
 * never talks to Storage directly, so it works identically whether the
 * caller sourced the URL from `driverApplications` or (post-activation)
 * wherever else the same field lives.
 */
export function DocumentThumbnailGrid({ documents }: { documents: ReviewDocument[] }) {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="tablet:grid-cols-3 grid grid-cols-2 gap-4">
        {documents.map((document, index) => (
          <button
            key={document.key}
            type="button"
            onClick={() => document.url && setOpenIndex(index)}
            disabled={!document.url}
            className="hover:border-brand flex flex-col gap-2 rounded-lg border border-neutral-200 p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-900">
              {document.url ? (
                <img
                  src={document.url}
                  alt={document.label}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-400">
                  <Icon name="fileText" size={24} />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <Text size="sm" weight="medium" className="truncate">
                {document.label}
              </Text>
              {document.reviewStatus && (
                <Badge tone={STATUS_TONE[document.reviewStatus]} className="shrink-0">
                  {t(`admin.documentReview.status.${document.reviewStatus}`)}
                </Badge>
              )}
            </div>
            {!document.url && (
              <Text size="xs" tone="muted">
                {t("admin.documentReview.notUploaded")}
              </Text>
            )}
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <DocumentLightbox
          documents={documents}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}

function DocumentLightbox({
  documents,
  index,
  onIndexChange,
  onClose,
}: {
  documents: ReviewDocument[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const document = documents[index]!;

  function reset() {
    setZoom(1);
    setRotation(0);
  }

  function go(delta: number) {
    const next = index + delta;
    if (next < 0 || next >= documents.length) return;
    reset();
    onIndexChange(next);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        closeLabel={t("common.close")}
        className="flex h-[85vh] max-h-[85vh] w-[calc(100%-2rem)] max-w-4xl flex-col overflow-hidden p-0"
      >
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 p-4 pr-12 dark:border-neutral-800">
          <div className="min-w-0">
            <Text weight="medium" className="truncate">
              {document.label}
            </Text>
            {document.uploadedAt && (
              <Text size="xs" tone="muted">
                {t("admin.documentReview.uploadedOn", {
                  date: document.uploadedAt.toLocaleDateString(),
                })}
              </Text>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <IconButton
              label={t("admin.documentReview.zoomOut")}
              size="sm"
              variant="ghost"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            >
              <Icon name="minus" size={16} />
            </IconButton>
            <IconButton
              label={t("admin.documentReview.zoomIn")}
              size="sm"
              variant="ghost"
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            >
              <Icon name="plus" size={16} />
            </IconButton>
            {/* No rotate icon exists in this design system's icon set (packages/ui/src/tokens/icons.ts) — a text button is used instead of adding a new icon asset for this sprint. */}
            <Button size="sm" variant="ghost" onClick={() => setRotation((r) => (r + 90) % 360)}>
              {t("admin.documentReview.rotate")}
            </Button>
            {document.url && (
              <Button size="sm" variant="ghost" asChild>
                <a href={document.url} target="_blank" rel="noopener noreferrer">
                  {t("admin.documentReview.openOriginal")}
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-neutral-950 p-6">
          {documents.length > 1 && (
            <>
              <IconButton
                label={t("common.previous")}
                size="sm"
                variant="ghost"
                onClick={() => go(-1)}
                disabled={index === 0}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-white/10 text-white hover:bg-white/20"
              >
                <Icon name="chevronLeft" size={18} />
              </IconButton>
              <IconButton
                label={t("common.next")}
                size="sm"
                variant="ghost"
                onClick={() => go(1)}
                disabled={index === documents.length - 1}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-white/10 text-white hover:bg-white/20"
              >
                <Icon name="chevronRight" size={18} />
              </IconButton>
            </>
          )}
          {document.url ? (
            <img
              src={document.url}
              alt={document.label}
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
              className="max-h-full max-w-full object-contain transition-transform duration-150"
            />
          ) : (
            <Text className="text-white">{t("admin.documentReview.notUploaded")}</Text>
          )}
        </div>

        {document.expiresAt && (
          <div className="border-t border-neutral-200 p-3 text-center dark:border-neutral-800">
            <Text size="xs" tone="muted">
              {t("admin.documentReview.expiresOn", {
                date: document.expiresAt.toLocaleDateString(),
              })}
            </Text>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
