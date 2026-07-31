import type { ComponentProps } from "react";

import { Icon } from "../icon/Icon";
import { StatusScreen } from "../status-screen/StatusScreen";

export type EmptyStateProps = Omit<ComponentProps<typeof StatusScreen>, "icon"> & { icon?: ComponentProps<typeof StatusScreen>["icon"] };

export function EmptyState({ icon, ...props }: EmptyStateProps) {
  return <StatusScreen icon={icon ?? <Icon name="search" size={40} />} {...props} />;
}
