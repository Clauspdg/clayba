import { cn, Heading, Text } from "@the-ride/ui";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

/** Shared "eyebrow + title + subtitle" header used across every redesigned marketing section. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <span className="text-brand text-sm font-semibold uppercase tracking-widest">
          {eyebrow}
        </span>
      )}
      <Heading level={2} className="max-w-2xl">
        {title}
      </Heading>
      {subtitle && (
        <Text size="lg" tone="muted" className="max-w-2xl">
          {subtitle}
        </Text>
      )}
    </div>
  );
}
