import type { LucideProps } from "lucide-react";

import { icons, type IconName } from "../../tokens/icons";

export interface IconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
  /** Decorative by default (`aria-hidden`). Pass a label if the icon carries meaning on its own (e.g. inside an unlabeled button). */
  label?: string;
}

export function Icon({ name, label, size = 20, strokeWidth = 1.75, ...props }: IconProps) {
  const LucideIcon = icons[name];
  return <LucideIcon size={size} strokeWidth={strokeWidth} aria-hidden={label ? undefined : true} aria-label={label} role={label ? "img" : undefined} {...props} />;
}
