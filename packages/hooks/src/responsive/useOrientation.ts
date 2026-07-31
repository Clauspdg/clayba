"use client";

import { useEffect, useState } from "react";

export type Orientation = "portrait" | "landscape";

interface Dimensions {
  width: number;
  height: number;
}

function resolveOrientation({ width, height }: Dimensions): Orientation {
  return height >= width ? "portrait" : "landscape";
}

function getWindowDimensions(): Dimensions {
  if (typeof window === "undefined") return { width: 0, height: 0 };
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Same pattern as `useBreakpoint`: defaults to tracking the web window,
 * or pass `useWindowDimensions()` from `react-native` explicitly on native.
 */
export function useOrientation(dimensions?: Dimensions): Orientation {
  const [size, setSize] = useState<Dimensions>(dimensions ?? getWindowDimensions());

  useEffect(() => {
    if (dimensions) {
      setSize(dimensions);
      return;
    }
    if (typeof window === "undefined") return;
    const handleResize = () => setSize(getWindowDimensions());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dimensions]);

  return resolveOrientation(size);
}
