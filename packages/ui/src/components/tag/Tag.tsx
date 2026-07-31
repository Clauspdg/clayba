import type { ComponentProps } from "react";

import { Pill } from "../pill/Pill";

export type TagProps = ComponentProps<typeof Pill>;

/** Non-interactive categorization label — e.g. a domain/category on a list row. */
export function Tag({ tone = "brand", ...props }: TagProps) {
  return <Pill tone={tone} {...props} />;
}
