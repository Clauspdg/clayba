import { Badge, Sheet, SheetContent, SheetTitle } from "@the-ride/ui";
import type { ReactNode } from "react";

export interface PreviewPaneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

/**
 * Approximate in-admin preview (Sprint 7.1 Site Content CMS). `apps/web`'s
 * marketing components live in a separate app, not a shared package, and
 * there's no server-side draft-mode to preview against under `apps/web`'s
 * static export — a pixel-identical live mirror isn't reasonably
 * achievable this sprint. This renders the *real* current draft text/media
 * using shared `@the-ride/ui` primitives, loosely resembling the live
 * section, and says so plainly rather than pretending to be a faithful
 * mirror.
 */
export function PreviewPane({ open, onOpenChange, title, children }: PreviewPaneProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" closeLabel="Close preview" className="overflow-y-auto">
        <SheetTitle className="mb-1">{title}</SheetTitle>
        <Badge tone="warning" className="mb-4">
          Approximate preview — the published site's exact styling/animation may differ
        </Badge>
        <div className="flex flex-col gap-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
