import * as SeparatorPrimitive from "@radix-ui/react-separator";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../../utils/cn";

export function Divider({ className, orientation = "horizontal", decorative = true, ...props }: ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      decorative={decorative}
      className={cn(
        "shrink-0 bg-neutral-200 dark:bg-neutral-800",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}
