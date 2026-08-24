import { useTheme } from "@the-ride/hooks";

import { getPalette, type Palette } from "./tokens";

/** Every screen/component reads colors through this, never `getPalette()` directly — one call site to change if the theme contract ever grows. */
export function usePalette(): Palette {
  const { resolvedTheme } = useTheme();
  return getPalette(resolvedTheme === "dark" ? "dark" : "light");
}
