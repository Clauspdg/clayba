import type { ComponentProps } from "react";

import { Icon } from "../icon/Icon";
import { StatusScreen } from "../status-screen/StatusScreen";

export type ErrorStateProps = Omit<ComponentProps<typeof StatusScreen>, "icon"> & { icon?: ComponentProps<typeof StatusScreen>["icon"] };

export function ErrorState({ icon, ...props }: ErrorStateProps) {
  return <StatusScreen icon={icon ?? <Icon name="alertTriangle" size={40} className="text-danger" />} {...props} />;
}
