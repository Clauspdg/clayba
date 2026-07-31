import type { ElementType, ReactNode } from "react";

import { Icon } from "../icon/Icon";
import type { NavItem } from "../navigation/nav-item";
import { cn } from "../../utils/cn";

export interface SidebarProps {
  header?: ReactNode;
  items: NavItem[];
  footer?: ReactNode;
  /** Defaults to a plain `<a>`; pass Next.js's `Link` for client-side navigation. */
  linkComponent?: ElementType;
  /** Collapsed to icon-only rail. */
  collapsed?: boolean;
  className?: string;
}

export function Sidebar({ header, items, footer, linkComponent: LinkComponent = "a", collapsed = false, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-neutral-200 bg-white transition-[width] duration-normal dark:border-neutral-800 dark:bg-neutral-950",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {header && <div className="flex h-16 items-center border-b border-neutral-200 px-4 dark:border-neutral-800">{header}</div>}
      <nav aria-label="Sidebar" className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <LinkComponent
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
              item.active && "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200",
            )}
          >
            {item.icon && <Icon name={item.icon} size={18} className="shrink-0" />}
            {!collapsed && <span className="truncate">{item.label}</span>}
          </LinkComponent>
        ))}
      </nav>
      {footer && <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">{footer}</div>}
    </aside>
  );
}
