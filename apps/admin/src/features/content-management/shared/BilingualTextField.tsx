import { Input, Textarea } from "@the-ride/ui";
import type { BilingualText } from "@the-ride/types";

export interface BilingualTextFieldProps {
  label: string;
  value: BilingualText;
  onChange: (next: BilingualText) => void;
  multiline?: boolean;
  rows?: number;
}

/**
 * One reusable FR/EN input, used by every Site Content CMS editor
 * (Sprint 7.1). Side-by-side rather than tabbed — an admin editing
 * marketing copy benefits from seeing both languages at once to keep them
 * consistent, whereas tabs would hide one language while editing the other.
 */
export function BilingualTextField({
  label,
  value,
  onChange,
  multiline,
  rows,
}: BilingualTextFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{label}</p>
      <div className="grid grid-cols-2 gap-4">
        {multiline ? (
          <>
            <Textarea
              label="🇫🇷 Français"
              value={value.fr}
              rows={rows}
              onChange={(e) => onChange({ ...value, fr: e.target.value })}
            />
            <Textarea
              label="🇺🇸 English"
              value={value.en}
              rows={rows}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
            />
          </>
        ) : (
          <>
            <Input
              label="🇫🇷 Français"
              value={value.fr}
              onChange={(e) => onChange({ ...value, fr: e.target.value })}
            />
            <Input
              label="🇺🇸 English"
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
            />
          </>
        )}
      </div>
    </div>
  );
}
