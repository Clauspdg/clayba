import { Heading, Icon, Text, type IconName } from "@the-ride/ui";
import type { ReactNode } from "react";

export function SimplePageLayout({
  title,
  body,
  icon,
  updatedLabel,
  children,
}: {
  title: string;
  body?: string;
  icon?: IconName;
  updatedLabel?: string;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <div className="mb-10 flex flex-col items-center text-center">
        {icon && (
          <span className="bg-brand-50 text-brand dark:bg-brand-900 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
            <Icon name={icon} size={24} />
          </span>
        )}
        <Heading level={1} className="mb-3">
          {title}
        </Heading>
        {body && (
          <Text size="lg" tone="muted" className="max-w-xl">
            {body}
          </Text>
        )}
        {updatedLabel && (
          <Text size="xs" tone="muted" className="mt-3">
            {updatedLabel}
          </Text>
        )}
      </div>
      {children && (
        <div className="shadow-elevation1 flex flex-col gap-5 rounded-3xl border border-neutral-100 bg-white p-8 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 [&_h2]:mt-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-900 dark:[&_h2]:text-neutral-50 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      )}
    </section>
  );
}
