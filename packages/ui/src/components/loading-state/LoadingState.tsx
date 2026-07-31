import type { ComponentProps } from "react";

import { StatusScreen } from "../status-screen/StatusScreen";

export type LoadingStateProps = Omit<ComponentProps<typeof StatusScreen>, "icon">;

export function LoadingState(props: LoadingStateProps) {
  return (
    <StatusScreen
      icon={<div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-brand dark:border-neutral-700" role="presentation" />}
      {...props}
    />
  );
}
