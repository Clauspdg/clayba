import type { ElementType } from "react";

import { Icon } from "../icon/Icon";
import { cn } from "../../utils/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Accessible name for the `<nav>`, e.g. "Breadcrumb". */
  label: string;
  /** Defaults to a plain `<a>`; pass Next.js's `Link` for client-side navigation. */
  linkComponent?: ElementType;
  className?: string;
}

export function Breadcrumb({ items, label, linkComponent: LinkComponent = "a", className }: BreadcrumbProps) {
  return (
    <nav aria-label={label} className={cn("flex items-center gap-1.5 text-sm", className)}>
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <LinkComponent href={item.href} className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50">
                  {item.label}
                </LinkComponent>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="font-medium text-neutral-900 dark:text-neutral-50">
                  {item.label}
                </span>
              )}
              {!isLast && <Icon name="chevronRight" size={14} className="text-neutral-400" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
