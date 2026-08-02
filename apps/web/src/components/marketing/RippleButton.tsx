"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type MouseEvent, type ReactNode } from "react";

interface RippleSpot {
  id: number;
  x: number;
  y: number;
  size: number;
}

let rippleCounter = 0;

/**
 * Wraps any button/link with a Material-style click ripple (Sprint 7
 * micro-interactions: "Button ripple") — purely a visual overlay, doesn't
 * touch the wrapped element's own click handling or the shared `Button`
 * component in `packages/ui`.
 */
export function RippleButton({ children, className }: { children: ReactNode; className?: string }) {
  const [ripples, setRipples] = useState<RippleSpot[]>([]);

  function handlePointerDown(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const id = ++rippleCounter;
    setRipples((current) => [
      ...current,
      { id, x: event.clientX - rect.left, y: event.clientY - rect.top, size },
    ]);
    window.setTimeout(() => setRipples((current) => current.filter((r) => r.id !== id)), 600);
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`relative inline-flex overflow-hidden rounded-full ${className ?? ""}`}
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ opacity: 0.35, scale: 0 }}
            animate={{ opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pointer-events-none absolute rounded-full bg-white"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
