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

export interface SidebarNavGroup {
  label: string;
  items: NavItem[];
}

export interface SidebarProps {
  header?: ReactNode;
  /** Ignored when `groups` is provided. */
  items?: NavItem[];
  /**
   * Labeled sections (e.g. a Driver Space's HOME/RIDES/FINANCE/DRIVER/
   * ACCOUNT groups) — an alternative to the flat `items` list for shells
   * that need visible section headers. Renders instead of `items` when
   * present; existing flat-`items` call sites (Admin, Passenger) are
   * unaffected.
   */
  groups?: SidebarNavGroup[];
  footer?: ReactNode;
  /** Defaults to a plain `<a>`; pass Next.js's `Link` for client-side navigation. */
  linkComponent?: ElementType;
  /** Collapsed to icon-only rail. */
  collapsed?: boolean;
  className?: string;
  /**
   * Below `laptop`, the permanent rail collapses into a slim top bar with a
   * hamburger trigger opening the same nav in a drawer (mirrors
   * `TopNavigation`'s mobile pattern) — a dashboard shell built around this
   * component previously had no mobile affordance at all: a fixed 256px
   * `<aside>` with no way to hide it. Defaults keep existing English call
   * sites working without changes.
   */
  mobileMenuLabel?: string;
  mobileMenuCloseLabel?: string;
}

export function Sidebar({
  header,
  items,
  groups,
  footer,
  linkComponent: LinkComponent = "a",
  collapsed = false,
  className,
  mobileMenuLabel = "Menu",
  mobileMenuCloseLabel = "Close",
}: SidebarProps) {
  const [open, setOpen] = useState(false);

  const renderItem = (item: NavItem, onNavigate?: () => void) => (
    <LinkComponent
      key={item.href}
      href={item.href}
      aria-current={item.active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
        item.active &&
          "bg-brand-50 text-brand-700 hover:bg-brand-50 hover:text-brand-700 dark:bg-brand-900 dark:text-brand-200 dark:hover:bg-brand-900",
      )}
    >
      {item.icon && <Icon name={item.icon} size={18} className="shrink-0" />}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </LinkComponent>
  );

  const navLinks = (onNavigate?: () => void) => {
    if (groups) {
      return (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              {!collapsed && (
                <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => renderItem(item, onNavigate))}
            </div>
          ))}
        </div>
      );
    }
    return (items ?? []).map((item) => renderItem(item, onNavigate));
  };

  return (
    <>
      {/* Permanent rail — laptop and up. */}
      <aside
        className={cn(
          "duration-normal laptop:flex hidden h-full flex-col border-r border-neutral-200 bg-white transition-[width] dark:border-neutral-800 dark:bg-neutral-950",
          collapsed ? "w-16" : "w-64",
          className,
        )}
      >
        {header && (
          <div className="flex h-16 items-center border-b border-neutral-200 px-4 dark:border-neutral-800">
            {header}
          </div>
        )}
        <nav aria-label="Sidebar" className="flex-1 space-y-1 overflow-y-auto p-3">
          {navLinks()}
        </nav>
        {footer && (
          <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">{footer}</div>
        )}
      </aside>

      {/* Slim top bar + drawer — below laptop. */}
      <div className="laptop:hidden flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
        <SidePanel open={open} onOpenChange={setOpen}>
          <SidePanelTrigger asChild>
            <IconButton label={mobileMenuLabel}>
              <Icon name="menu" size={20} />
            </IconButton>
          </SidePanelTrigger>
          <SidePanelContent
            side="left"
            closeLabel={mobileMenuCloseLabel}
            className="flex flex-col p-0"
          >
            <SidePanelTitle className="sr-only">{mobileMenuLabel}</SidePanelTitle>
            {header && (
              <div className="flex h-16 shrink-0 items-center border-b border-neutral-200 px-4 dark:border-neutral-800">
                {header}
              </div>
            )}
            <nav aria-label="Sidebar" className="flex-1 space-y-1 overflow-y-auto p-3">
              {navLinks(() => setOpen(false))}
            </nav>
            {footer && (
              <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
                {footer}
              </div>
            )}
          </SidePanelContent>
        </SidePanel>
        {header}
      </div>
    </>
  );
}
