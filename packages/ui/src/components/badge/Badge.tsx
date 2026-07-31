import type { ComponentProps } from "react";

import { Pill } from "../pill/Pill";

export type BadgeProps = ComponentProps<typeof Pill>;

/** Non-interactive status pill — e.g. "New", a count, an order status. */
export function Badge(props: BadgeProps) {
  return <Pill {...props} />;
}
