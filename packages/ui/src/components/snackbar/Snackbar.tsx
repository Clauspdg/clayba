import { useToast } from "../toast/ToastProvider";
import type { ToastVariant } from "../toast/toast.types";

export interface SnackbarOptions {
  message: string;
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

/**
 * Single-line, no-title convenience over the same toast queue as `Toast`
 * — see docs/design-system.md, "no duplicated code". Prefer this for brief
 * confirmations ("Saved", "Copied"); use `useToast` directly when you need
 * a title.
 */
export function useSnackbar() {
  const { toast, dismiss } = useToast();

  function showSnackbar({ message, variant, actionLabel, onAction, durationMs }: SnackbarOptions): string {
    return toast({ description: message, variant, actionLabel, onAction, durationMs });
  }

  return { showSnackbar, dismiss };
}
