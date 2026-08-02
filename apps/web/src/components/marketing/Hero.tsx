"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

export interface HeroProps {
  children: ReactNode;
  className?: string;
  /** Sprint 7: subtle scroll-parallax on the background layer. Off by default so the smaller Heroes on About/Safety/etc. stay simple. */
  parallax?: boolean;
}

/**
 * Premium hero backdrop (Sprint 6, animated further in Sprint 7).
 *
 * No licensed video or photography is available in this environment, so
 * the "fond vidéo avec fallback image" the brief asks for is a crafted,
 * continuously-animated CSS/SVG treatment — slow-panning gradient blobs
 * plus a drifting dot grid — standing in for both the video and its
 * fallback image. Disclosed here rather than silently faked with a
 * broken <video> tag pointed at a URL that doesn't exist.
 */
export function Hero({ children, className, parallax = false }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", parallax ? "30%" : "0%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, parallax ? 80 : 0]);
  const contentOpacity = useTransform(scrollYProgress, [0, 1], [1, parallax ? 0.3 : 1]);

  return (
    <section ref={ref} className={`relative overflow-hidden bg-neutral-900 ${className ?? ""}`}>
      <motion.div style={{ y: backgroundY }} className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(232,106,47,0.35),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(200,91,42,0.3),_transparent_55%)]" />
        <div
          className="animate-drift absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle, #FFFFFF 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <motion.div
          className="bg-brand/30 absolute -left-24 top-1/4 h-72 w-72 rounded-full blur-[100px]"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="bg-brand-700/40 absolute -right-24 bottom-0 h-96 w-96 rounded-full blur-[120px]"
          animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Dark overlay — guarantees text contrast regardless of what sits behind it (future real video/image). */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-neutral-900" />
      </motion.div>
      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative">
        {children}
      </motion.div>
    </section>
  );
}
