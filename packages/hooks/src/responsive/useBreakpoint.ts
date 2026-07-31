"use client";

import { BREAKPOINTS, getBreakpointForWidth, type BreakpointName } from "@the-ride/utils";
import { useEffect, useState } from "react";

/**
 * Resolves the current `BreakpointName` (mobile/tablet/laptop/desktop).
 *
 * On web, defaults to tracking `window.innerWidth` with no setup required.
 * React Native has no `window`, so native apps should pass
 * `useWindowDimensions().width` from `react-native` explicitly:
 * `useBreakpoint(useWindowDimensions().width)`.
 */
export function useBreakpoint(width?: number): BreakpointName {
  const [innerWidth, setInnerWidth] = useState<number>(width ?? (typeof window !== "undefined" ? window.innerWidth : BREAKPOINTS.mobile));

  useEffect(() => {
    if (width !== undefined) {
      setInnerWidth(width);
      return;
    }
    if (typeof window === "undefined") return;
    const handleResize = () => setInnerWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [width]);

  return getBreakpointForWidth(innerWidth);
}
