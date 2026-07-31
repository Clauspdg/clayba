import type { IconName } from "../../tokens/icons";

/** Shared item shape across TopNavigation, Sidebar, and BottomNavigation. */
export interface NavItem {
  label: string;
  href: string;
  icon?: IconName;
  active?: boolean;
}
