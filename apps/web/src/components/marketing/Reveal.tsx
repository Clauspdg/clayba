"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** "up" (default) slides in from below; "scale" grows in from 95%. */
  variant?: "up" | "scale";
}

/** Shared scroll-reveal wrapper (Sprint 7 micro-animations) — fades/slides a section in once it enters the viewport, then never re-triggers. */
export function Reveal({ children, className, delay = 0, variant = "up" }: RevealProps) {
  const initial = variant === "scale" ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: 24 };
  const animate = variant === "scale" ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 };

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
