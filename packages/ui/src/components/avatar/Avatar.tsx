"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../../utils/cn";

const avatarVariants = cva("relative flex shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700", {
  variants: {
    size: {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-14 w-14 text-lg",
    },
  },
  defaultVariants: { size: "md" },
});

export interface AvatarProps extends ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>, VariantProps<typeof avatarVariants> {
  src?: string;
  alt: string;
  /** Shown while the image loads or if it fails — usually initials. */
  fallback: string;
}

export function Avatar({ className, size, src, alt, fallback, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root className={cn(avatarVariants({ size }), className)} {...props}>
      {src && <AvatarPrimitive.Image src={src} alt={alt} className="aspect-square h-full w-full object-cover" />}
      <AvatarPrimitive.Fallback
        delayMs={src ? 400 : 0}
        className="flex h-full w-full items-center justify-center font-medium text-neutral-600 dark:text-neutral-300"
      >
        {fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
