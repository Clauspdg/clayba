import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType, HTMLAttributes } from "react";

import { cn } from "../../utils/cn";

const headingVariants = cva("font-sans font-semibold tracking-tight text-neutral-900 dark:text-neutral-50", {
  variants: {
    level: {
      1: "text-4xl md:text-5xl",
      2: "text-3xl md:text-4xl",
      3: "text-2xl md:text-3xl",
      4: "text-xl md:text-2xl",
      5: "text-lg md:text-xl",
      6: "text-base md:text-lg",
    },
  },
  defaultVariants: { level: 2 },
});

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function Heading({ className, level = 2, as, ...props }: HeadingProps) {
  const Component = (as ?? (`h${level}` as const)) as ElementType;
  return <Component className={cn(headingVariants({ level }), className)} {...props} />;
}

const textVariants = cva("font-sans text-neutral-700 dark:text-neutral-300", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
    },
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    tone: {
      default: "text-neutral-700 dark:text-neutral-300",
      muted: "text-neutral-500 dark:text-neutral-400",
      strong: "text-neutral-900 dark:text-neutral-50",
      danger: "text-danger",
      success: "text-success",
      brand: "text-brand",
    },
  },
  defaultVariants: { size: "base", weight: "regular", tone: "default" },
});

export interface TextProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div" | "label";
}

export function Text({ className, size, weight, tone, as: Component = "p", ...props }: TextProps) {
  return <Component className={cn(textVariants({ size, weight, tone }), className)} {...props} />;
}
