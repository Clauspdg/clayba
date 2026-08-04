"use client";

import { useState, type ElementType, type ReactNode } from "react";

import { Icon } from "../icon/Icon";
import { IconButton } from "../icon-button/IconButton";
import {
  SidePanel,
  SidePanelContent,
  SidePanelTitle,
  SidePanelTrigger,
} from "../side-panel/SidePanel";
import type { NavItem } from "../navigation/nav-item";
import { cn } from "../../utils/cn";

export interface TopNavigationProps {
  logo: ReactNode;
  items: NavItem[];
  actions?: ReactNode;
  /** Defaults to a plain `<a>`; pass Next.js's `Link` for client-side navigation. */
  linkComponent?: ElementType;
  /** Accessible label for the mobile menu toggle button (below the `laptop` breakpoint, where `items` collapse into a drawer). */
  menuLabel?: string;
  /** Accessible label for the mobile menu's close button. */
  closeLabel?: string;
  /**
   * Extra content shown inside the mobile drawer, below the nav links
   * (Sprint 8.4c). For callers whose `actions` row has more controls than
   * fit on a narrow phone screen — hide the overflow-prone ones from
   * `actions` below `laptop` (e.g. `className="laptop:flex hidden"`) and
   * pass the same controls here instead, so they stay reachable rather
   * than silently causing horizontal overflow.
   */
  mobileExtra?: ReactNode;
  /**
   * `"transparent"` (Sprint 7 — premium navbar) renders a see-through bar
   * with white nav text, meant for sitting over a dark hero at the top of
   * a page — the caller is responsible for switching back to `"solid"`
   * (the default, and the only variant previously supported) once the
   * page scrolls past the hero, since only the caller knows scroll
   * position. Backward compatible: omitting this prop is identical to
   * the pre-Sprint-7 behavior.
   */
  variant?: "solid" | "transparent";
  className?: string;
}

export function TopNavigation({
  logo,
  items,
  actions,
  linkComponent: LinkComponent = "a",
  menuLabel = "Menu",
  closeLabel = "Close",
  variant = "solid",
  className,
  mobileExtra,
}: TopNavigationProps) {
  const [open, setOpen] = useState(false);
  const transparent = variant === "transparent";

  const navLinks = (onNavigate?: () => void) =>
    items.map((item) => (
      <LinkComponent
        key={item.href}
        href={item.href}
        aria-current={item.active ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          "text-sm font-medium transition-colors",
          transparent
            ? "text-white/85 hover:text-white"
            : "hover:text-brand dark:hover:text-brand-300 text-neutral-600 dark:text-neutral-400",
          item.active && (transparent ? "text-white" : "text-brand dark:text-brand-300"),
        )}
      >
        {item.label}
      </LinkComponent>
    ));

  return (
    <header
      className={cn(
        "duration-normal flex h-16 items-center justify-between px-6 transition-[background-color,border-color,backdrop-filter]",
        transparent
          ? "border-b border-transparent bg-transparent"
          : "border-b border-neutral-200 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/90",
        className,
      )}
    >
      <div className="flex items-center gap-8">
        {logo}
        <nav aria-label="Primary" className="laptop:flex hidden items-center gap-6">
          {navLinks()}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {items.length > 0 && (
          <SidePanel open={open} onOpenChange={setOpen}>
            <SidePanelTrigger asChild>
              <IconButton
                label={menuLabel}
                className={cn("laptop:hidden", transparent && "text-white hover:bg-white/10")}
              >
                <Icon name="menu" size={20} />
              </IconButton>
            </SidePanelTrigger>
            <SidePanelContent side="right" closeLabel={closeLabel}>
              <SidePanelTitle className="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {menuLabel}
              </SidePanelTitle>
              <nav aria-label="Mobile" className="flex flex-col gap-5">
                {navLinks(() => setOpen(false))}
              </nav>
              {mobileExtra && (
                <div className="mt-6 flex flex-col gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
                  {mobileExtra}
                </div>
              )}
            </SidePanelContent>
          </SidePanel>
        )}
      </div>
    </header>
  );
}
