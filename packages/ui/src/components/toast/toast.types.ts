export type ToastVariant = "default" | "success" | "danger" | "warning";

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

export interface ToastItem extends ToastOptions {
  id: string;
}
