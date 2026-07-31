import type { ComponentProps } from "react";

import { SidePanel, SidePanelClose, SidePanelContent, SidePanelDescription, SidePanelTitle, SidePanelTrigger } from "../side-panel/SidePanel";

/** Bottom-anchored panel — the mobile-style equivalent of `Sheet`. */
export const Drawer = SidePanel;
export const DrawerTrigger = SidePanelTrigger;
export const DrawerClose = SidePanelClose;
export const DrawerTitle = SidePanelTitle;
export const DrawerDescription = SidePanelDescription;

export function DrawerContent(props: Omit<ComponentProps<typeof SidePanelContent>, "side">) {
  return <SidePanelContent side="bottom" {...props} />;
}
