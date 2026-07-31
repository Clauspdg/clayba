"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { Icon } from "../icon/Icon";
import { cn } from "../../utils/cn";
import type { ToastItem, ToastOptions } from "./toast.types";

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let toastCounter = 0;

const variantBorder: Record<NonNullable<ToastOptions["variant"]>, string> = {
  default: "border-neutral-200 dark:border-neutral-700",
  success: "border-green-200 dark:border-green-900",
  danger: "border-red-200 dark:border-red-900",
  warning: "border-amber-200 dark:border-amber-900",
};

export interface ToastProviderProps {
  children: ReactNode;
  /** Accessible name for every toast's close button. */
  closeLabel: string;
}

/**
 * Wrap the app root in this once. `Snackbar` (a single-line, no-title
 * variant) is built on the exact same provider/queue — see `Snackbar.tsx`.
 */
export function ToastProvider({ children, closeLabel }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = options.id ?? `toast-${++toastCounter}`;
    setToasts((current) => [...current, { ...options, id }]);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((item) => (
          <ToastPrimitive.Root
            key={item.id}
            duration={item.durationMs ?? 5000}
            onOpenChange={(open) => {
              if (!open) dismiss(item.id);
            }}
            className={cn(
              "relative rounded-lg border bg-white p-4 pr-8 shadow-elevation3 data-[state=open]:animate-slide-up dark:bg-neutral-900",
              variantBorder[item.variant ?? "default"],
            )}
          >
            {item.title && <ToastPrimitive.Title className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{item.title}</ToastPrimitive.Title>}
            {item.description && (
              <ToastPrimitive.Description className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{item.description}</ToastPrimitive.Description>
            )}
            {item.actionLabel && item.onAction && (
              <ToastPrimitive.Action altText={item.actionLabel} onClick={item.onAction} className="mt-2 block text-sm font-medium text-brand">
                {item.actionLabel}
              </ToastPrimitive.Action>
            )}
            <ToastPrimitive.Close aria-label={closeLabel} className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
              <Icon name="close" size={14} />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
