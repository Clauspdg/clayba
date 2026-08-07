import { Icon, type IconName } from "@the-ride/ui";

export interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
  tone?: "brand" | "success" | "neutral";
}

const TONE_CLASSES: Record<NonNullable<FeatureCardProps["tone"]>, string> = {
  brand: "bg-brand-50 text-brand dark:bg-brand-900 dark:text-brand-200",
  success: "bg-green-50 text-success dark:bg-green-950",
  neutral: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
};

/** Reusable glass-edged feature card used across Safety/About/Services (Sprint 6). */
export function FeatureCard({ icon, title, description, tone = "brand" }: FeatureCardProps) {
  return (
    <div className="shadow-elevation1 duration-normal hover:shadow-elevation3 flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-white/80 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 dark:border-neutral-800 dark:bg-neutral-900/80">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}
      >
        <Icon name={icon} size={20} />
      </span>
      <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">{title}</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
    </div>
  );
}
