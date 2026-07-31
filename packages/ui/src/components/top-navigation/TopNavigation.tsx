import type { ElementType, ReactNode } from "react";

import type { NavItem } from "../navigation/nav-item";
import { cn } from "../../utils/cn";

export interface TopNavigationProps {
  logo: ReactNode;
  items: NavItem[];
  actions?: ReactNode;
  /** Defaults to a plain `<a>`; pass Next.js's `Link` for client-side navigation. */
  linkComponent?: ElementType;
  className?: string;
}

export function TopNavigation({ logo, items, actions, linkComponent: LinkComponent = "a", className }: TopNavigationProps) {
  return (
    <header className={cn("flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6 dark:border-neutral-800 dark:bg-neutral-950", className)}>
      <div className="flex items-center gap-8">
        {logo}
        <nav aria-label="Primary" className="hidden items-center gap-6 laptop:flex">
          {items.map((item) => (
            <LinkComponent
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50",
                item.active && "text-neutral-900 dark:text-neutral-50",
              )}
            >
              {item.label}
            </LinkComponent>
          ))}
        </nav>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
