import { Heading, Text } from "@the-ride/ui";
import type { ReactNode } from "react";

export function SimplePageLayout({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <Heading level={1} className="mb-4">
        {title}
      </Heading>
      {body && (
        <Text size="lg" tone="muted">
          {body}
        </Text>
      )}
      {children}
    </section>
  );
}
