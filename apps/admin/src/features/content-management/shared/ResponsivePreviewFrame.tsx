"use client";

import { Button } from "@the-ride/ui";
import type { ReactNode } from "react";
import { useState } from "react";

type PreviewWidth = "desktop" | "laptop" | "tablet" | "mobile";

const WIDTH_BY_PRESET: Record<PreviewWidth, string> = {
  desktop: "100%",
  laptop: "1024px",
  tablet: "768px",
  mobile: "390px",
};

const PRESETS: { key: PreviewWidth; label: string }[] = [
  { key: "desktop", label: "Desktop" },
  { key: "laptop", label: "Laptop" },
  { key: "tablet", label: "Tablet" },
  { key: "mobile", label: "Mobile" },
];

/**
 * Width-preset wrapper used inside `PreviewPane` (Sprint 8.3) — the
 * Dashboard-wide "responsive preview" ask, implemented generically enough
 * to drop into any editor's preview content, not just Homepage's.
 */
export function ResponsivePreviewFrame({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<PreviewWidth>("desktop");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ key, label }) => (
          <Button
            key={key}
            size="sm"
            variant={preset === key ? "primary" : "outline"}
            onClick={() => setPreset(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950">
        <div className="mx-auto transition-all" style={{ maxWidth: WIDTH_BY_PRESET[preset] }}>
          {children}
        </div>
      </div>
    </div>
  );
}
