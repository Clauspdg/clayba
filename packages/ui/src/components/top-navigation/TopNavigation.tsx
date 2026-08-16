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
  /** HOME-02 — optional surface classes for the mobile drawer's `SidePanelContent`, so a caller can visually align it with a custom header treatment without this component hardcoding one look. Omitting it keeps `SidePanelContent`'s own default surface. */
  mobileMenuClassName?: string;
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
  mobileMenuClassName,
}: TopNavigationProps) {
  const [open, setOpen] = useState(false);
  const transparent = variant === "transparent";

  /**
   * `useTransparentStyle` defaults to the header's own `transparent` flag
   * (correct for the desktop nav, which sits over the same see-through bar)
   * but the mobile drawer always passes `false` explicitly — its panel has
   * its own solid white/neutral-900 background (`SidePanelContent`)
   * regardless of the header variant, so white-on-white text would
   * otherwise render invisibly whenever the transparent header variant is
   * active (e.g. the unscrolled home page).
   */
  const navLinks = (onNavigate?: () => void, useTransparentStyle = transparent) =>
    items.map((item) => (
      <LinkComponent
        key={item.href}
        href={item.href}
        aria-current={item.active ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          // HOME-02 — a restrained scale-transform underline (no new JS
          // state, no glow) replaces a plain color swap as the hover/active
          // affordance, on both the desktop bar and the mobile drawer.
          "relative py-1 text-sm font-medium transition-colors duration-200",
          "after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:transition-transform after:duration-300 after:ease-out",
          useTransparentStyle
            ? "text-white/85 after:bg-white hover:text-white hover:after:scale-x-100"
            : "after:bg-brand hover:text-brand dark:hover:text-brand-300 text-neutral-600 hover:after:scale-x-100 dark:text-neutral-400",
          item.active &&
            (useTransparentStyle
              ? "text-white after:scale-x-100"
              : "text-brand dark:text-brand-300 after:scale-x-100"),
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
        <nav aria-label="Primary" className="laptop:flex hidden items-center gap-8">
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
            <SidePanelContent side="right" closeLabel={closeLabel} className={mobileMenuClassName}>
              <SidePanelTitle className="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {menuLabel}
              </SidePanelTitle>
              <nav aria-label="Mobile" className="flex flex-col gap-5">
                {navLinks(() => setOpen(false), false)}
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
