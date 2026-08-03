"use client";

import { useBreakpoint } from "@the-ride/hooks";
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
    <section ref={ref} className={`relative overflow-hidden bg-neutral-900 ${className ?? ""}`}>
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
          </>
        )}
        {/* Dark overlay — guarantees text contrast regardless of what sits behind it. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-neutral-900" />
      </motion.div>
      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative">
        {children}
      </motion.div>
    </section>
  );
}
