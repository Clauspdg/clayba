"use client";

import { useBreakpoint } from "@the-ride/hooks";
import { cn } from "@the-ride/ui";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, type ReactNode } from "react";

export interface HeroProps {
  children: ReactNode;
  className?: string;
  /** Sprint 7: subtle scroll-parallax on the background layer. Off by default so the smaller Heroes on About/Safety/etc. stay simple. */
  parallax?: boolean;
  /**
   * Sprint 7.2 Site Content CMS: per-breakpoint admin-uploaded backgrounds.
   * Resolution falls back from the current breakpoint down toward desktop
   * when a smaller breakpoint's asset isn't set (e.g. no mobile image ->
   * tablet image -> desktop image), then to the default animated
   * treatment when nothing at all is configured. A video always falls
   * back to whichever image is resolved if it fails to load/play.
   */
  backgroundDesktopImageUrl?: string;
  backgroundLaptopImageUrl?: string;
  backgroundTabletImageUrl?: string;
  backgroundMobileImageUrl?: string;
  backgroundDesktopVideoUrl?: string;
  backgroundMobileVideoUrl?: string;
  backgroundPosterImageUrl?: string;
}

/**
 * Premium hero backdrop (Sprint 6, animated further in Sprint 7, made
 * CMS-configurable in Sprint 7.1 and given per-breakpoint backgrounds in
 * Sprint 7.2).
 *
 * Defaults to `px-6 pt-24 pb-24` (Sprint 8.4b — equivalent to `py-24`, but
 * spelled out as separate `pt`/`pb` so `tailwind-merge` reliably strips
 * both when a caller overrides with `pt-*`/`pb-*` values instead of `py-*`;
 * `tailwind-merge`'s conflict resolution only recognizes same-axis-group
 * overrides, not shorthand-vs-single-side in every direction) so every
 * simple content page gets identical spacing without hand-rolling its own
 * padding. `className` is merged via `cn`, so a caller overriding padding
 * (e.g. Home's asymmetric top/bottom values for its fixed transparent
 * header) cleanly replaces the default instead of both classes coexisting
 * and silently depending on Tailwind's internal utility ordering to "win".
 * The section's height is otherwise fully content-driven — no min-height
 * here, and no negative margin on this component or any of its callers
 * should ever be used to adjust the gap to the next section; give that
 * section its own normal top padding instead.
 *
 * When no admin-uploaded background exists, this is a crafted,
 * continuously-animated CSS/SVG treatment — slow-panning gradient blobs
 * plus a drifting dot grid — standing in for the "fond vidéo" the original
 * brief asked for. Once a real image/video is published, it renders
 * instead (the crafted treatment would visually clash layered under real
 * media, so it steps aside rather than compositing with it).
 */
export function Hero({
  children,
  className,
  parallax = false,
  backgroundDesktopImageUrl,
  backgroundLaptopImageUrl,
  backgroundTabletImageUrl,
  backgroundMobileImageUrl,
  backgroundDesktopVideoUrl,
  backgroundMobileVideoUrl,
  backgroundPosterImageUrl,
}: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", parallax ? "30%" : "0%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, parallax ? 80 : 0]);
  const contentOpacity = useTransform(scrollYProgress, [0, 1], [1, parallax ? 0.3 : 1]);

  const breakpoint = useBreakpoint();
  const imageUrl =
    breakpoint === "mobile"
      ? (backgroundMobileImageUrl ??
        backgroundTabletImageUrl ??
        backgroundLaptopImageUrl ??
        backgroundDesktopImageUrl)
      : breakpoint === "tablet"
        ? (backgroundTabletImageUrl ?? backgroundLaptopImageUrl ?? backgroundDesktopImageUrl)
        : breakpoint === "laptop"
          ? (backgroundLaptopImageUrl ?? backgroundDesktopImageUrl)
          : backgroundDesktopImageUrl;
  const videoUrl =
    breakpoint === "mobile"
      ? (backgroundMobileVideoUrl ?? backgroundDesktopVideoUrl)
      : backgroundDesktopVideoUrl;

  const showVideo = Boolean(videoUrl) && !videoFailed;
  const showImage = !showVideo && Boolean(imageUrl);
  const hasCustomBackground = showVideo || showImage;

  return (
    <section
      ref={ref}
      className={cn("relative overflow-hidden bg-neutral-950 px-6 pb-24 pt-24", className)}
    >
      <motion.div style={{ y: backgroundY }} className="absolute inset-0">
        {showVideo && (
          // Decorative background video — muted, looping, non-informational; no captions track needed.
          <video
            src={videoUrl}
            poster={backgroundPosterImageUrl}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoFailed(true)}
            onStalled={() => setVideoFailed(true)}
          />
        )}
        {showImage && (
          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {!hasCustomBackground && (
          <>
            {/*
             * HOME-03 — full premium-composition rebuild of the no-CMS-media
             * default (was two soft blobs over a flat dark fill). Deep
             * graphite base -> controlled copper glow from above -> a wide,
             * low-opacity "mobility grid" (same line-grid language as
             * MapPreview, tying the site's map/route visual system into the
             * Hero) -> two repositioned ambient drift blobs -> a faint
             * diagonal glass sheen -> an edge vignette for focus. Every
             * layer stays within the brand's orange family and low opacity
             * — no neon, no sci-fi glow lines.
             */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-neutral-900" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_65%_at_50%_-10%,rgba(232,106,47,0.32),transparent_62%)]" />
            <div
              className="animate-drift absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
              }}
            />
            <motion.div
              className="bg-brand/25 absolute -right-16 top-0 h-80 w-80 rounded-full blur-[110px]"
              animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="bg-brand-700/35 absolute -left-24 bottom-0 h-96 w-96 rounded-full blur-[130px]"
              animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
              transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_85%_at_50%_45%,transparent_45%,rgba(0,0,0,0.4)_100%)]" />
          </>
        )}
        {/* Dark overlay — guarantees text contrast regardless of what sits behind it. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-neutral-950" />
      </motion.div>
      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative">
        {children}
      </motion.div>
    </section>
  );
}
