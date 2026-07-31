import type { HTMLAttributes } from "react";

import { cn } from "../../utils/cn";

/** Loading placeholder for content that hasn't arrived yet. `aria-hidden` — pair with a visually-hidden "Loading" label from the caller if it's the only content on screen. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800", className)} {...props} />;
}
