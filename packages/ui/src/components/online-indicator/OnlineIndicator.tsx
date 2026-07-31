import { StatusIndicator } from "../status-indicator/StatusIndicator";

export interface OnlineIndicatorProps {
  online: boolean;
  onlineLabel: string;
  offlineLabel: string;
  className?: string;
}

/** Built on `StatusIndicator` — see docs/design-system.md, "no duplicated code". */
export function OnlineIndicator({ online, onlineLabel, offlineLabel, className }: OnlineIndicatorProps) {
  return <StatusIndicator tone={online ? "success" : "neutral"} label={online ? onlineLabel : offlineLabel} className={className} />;
}
