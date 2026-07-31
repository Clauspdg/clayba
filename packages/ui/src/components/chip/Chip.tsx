import type { ComponentProps } from "react";

import { Icon } from "../icon/Icon";
import { Pill } from "../pill/Pill";

export interface ChipProps extends ComponentProps<typeof Pill> {
  /** Renders a dismiss button when provided. Also its accessible label. */
  onRemove?: () => void;
  removeLabel?: string;
}

/** Interactive, dismissible pill — e.g. an applied filter. */
export function Chip({ onRemove, removeLabel, children, ...props }: ChipProps) {
  return (
    <Pill {...props}>
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={removeLabel} className="ml-0.5 rounded-full hover:opacity-70">
          <Icon name="close" size={12} strokeWidth={2.5} />
        </button>
      )}
    </Pill>
  );
}
