import type { ElementType } from "react";

import { Icon } from "../icon/Icon";
import type { NavItem } from "../navigation/nav-item";
import { cn } from "../../utils/cn";

export interface BottomNavigationProps {
  items: NavItem[];
  /** Defaults to a plain `<a>`; pass Next.js's `Link` for client-side navigation. */
  linkComponent?: ElementType;
  className?: string;
}

/** Mobile-style fixed tab bar for web. React Native apps use their own local bottom-tab primitive (Metro/RN have no shared JSX runtime with web — see docs/ui-architecture.md). */
export function BottomNavigation({ items, linkComponent: LinkComponent = "a", className }: BottomNavigationProps) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
        className,
      )}
    >
      {items.map((item) => (
        <LinkComponent
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400",
            item.active && "text-brand",
          )}
        >
          {item.icon && <Icon name={item.icon} size={22} />}
          {item.label}
        </LinkComponent>
      ))}
    </nav>
  );
}
