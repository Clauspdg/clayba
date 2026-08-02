import { EmptyState, Heading, Illustration } from "@the-ride/ui";

/**
 * Content Management → Download Section (Sprint 7.1 Site Content CMS).
 * Schema (`downloadsContentSchema` in `@the-ride/types`) and Firestore/
 * Storage rules already exist — this editor UI is a fast-follow, out of
 * scope for this sprint's MVP.
 */
export function DownloadsContentPage() {
  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>Download Section</Heading>
      <EmptyState
        icon={<Illustration name="empty" size={80} />}
        title="Coming soon"
        description="The data model is ready; this editor ships in a follow-up sprint."
      />
    </div>
  );
}
