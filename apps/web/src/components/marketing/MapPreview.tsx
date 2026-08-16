"use client";

import { Icon, useTranslation } from "@the-ride/ui";
import { motion } from "framer-motion";

const ROUTE_PATH = "M60 220 C 140 220, 140 100, 220 100 S 320 60, 340 60";

/**
 * Map placeholder (Sprint 6, animated Sprint 7, elevated to a premium
 * illustrative "mobility interface" in HOME-06A). Still an abstract
 * vector composition, not a real Maps/geocoding integration
 * (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is empty in this environment) — the
 * small "Preview" chip keeps that honestly visible even as the visual
 * fidelity goes up. The grid/route language deliberately echoes the
 * Hero's own default background (see Hero.tsx) so the two sections read
 * as one consistent "mobility" system.
 */
export interface MapPreviewProps {
  distanceValue?: string;
  etaValue?: string;
}

export function MapPreview({ distanceValue = "12.4 km", etaValue = "18 min" }: MapPreviewProps) {
  const { t } = useTranslation();

  return (
    <div className="shadow-elevation2 relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800">
      {/* Depth base — genuinely different light/dark surfaces (this section
          sits on an otherwise-light page); the dark palette borrows the
          Hero's graphite/copper tones for cross-section cohesion. */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage: "linear-gradient(135deg, #FBFAF7 0%, #F2EEE8 55%, #E9E1D6 100%)",
        }}
      />
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage:
            "radial-gradient(60% 55% at 84% 10%, rgba(232,106,47,0.16), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          backgroundImage: "linear-gradient(160deg, #202024 0%, #18181B 55%, #101012 100%)",
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          backgroundImage:
            "radial-gradient(60% 55% at 84% 10%, rgba(232,106,47,0.3), transparent 70%)",
        }}
      />

      {/* Abstract city blocks — decorative depth only, never meant to read as real parcels/streets/data. */}
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 h-full w-full text-neutral-900 dark:text-white"
        style={{ opacity: 0.05 }}
        aria-hidden="true"
      >
        <rect x="18" y="26" width="112" height="72" rx="12" fill="currentColor" />
        <rect x="252" y="168" width="132" height="92" rx="12" fill="currentColor" />
        <rect x="150" y="204" width="70" height="52" rx="10" fill="currentColor" />
      </svg>

      {/* Road grid — same visual language as the Hero, faded toward the frame edges for depth. */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(35,29,23,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(35,29,23,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.3,
          maskImage: "radial-gradient(80% 80% at 50% 50%, black 55%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(80% 80% at 50% 50%, black 55%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.1,
          maskImage: "radial-gradient(80% 80% at 50% 50%, black 55%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(80% 80% at 50% 50%, black 55%, transparent 100%)",
        }}
      />

      {/* Preview honesty chip — this stays a styled illustration with simulated distance/ETA, never real-time map data. */}
      <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/35 bg-white/75 px-2.5 py-1 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/60">
        <Icon name="info" size={11} className="text-brand" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
          {t("map.previewLabel")}
        </span>
      </div>

      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <filter id="mapRouteGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <motion.path
          d={ROUTE_PATH}
          fill="none"
          stroke="#E86A2F"
          strokeWidth="10"
          strokeLinecap="round"
          filter="url(#mapRouteGlow)"
          style={{ opacity: 0.35 }}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />
        <motion.path
          d={ROUTE_PATH}
          fill="none"
          stroke="#E86A2F"
          strokeWidth="3.5"
          strokeDasharray="2 9"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />
        <g>
          <circle r="10" fill="#E86A2F" style={{ opacity: 0.25 }}>
            <animateMotion dur="4s" repeatCount="indefinite" path={ROUTE_PATH} />
          </circle>
          <circle r="6" fill="#232323" stroke="white" strokeWidth="2">
            <animateMotion dur="4s" repeatCount="indefinite" path={ROUTE_PATH} rotate="auto" />
          </circle>
        </g>
      </svg>

      {/* Pickup marker */}
      <div className="absolute left-[13%] top-[68%] flex flex-col items-center">
        <span className="relative flex h-9 w-9 items-center justify-center">
          <motion.span
            className="absolute inset-0 rounded-full bg-neutral-900/35 dark:bg-white/20"
            animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
          />
          <span className="shadow-elevation2 relative flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white ring-2 ring-white dark:ring-neutral-900">
            <Icon name="mapPin" size={18} />
          </span>
        </span>
        <span className="shadow-elevation1 mt-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50">
          {t("map.pickup")}
        </span>
      </div>

      {/* Destination marker */}
      <div className="absolute right-[13%] top-[16%] flex flex-col items-center">
        <span className="bg-brand flex h-9 w-9 items-center justify-center rounded-full text-white shadow-[0_0_22px_-4px_rgba(232,106,47,0.7)] ring-2 ring-white dark:ring-neutral-900">
          <Icon name="flag" size={16} />
        </span>
        <span className="shadow-elevation1 mt-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50">
          {t("map.destination")}
        </span>
      </div>

      {/* Distance / ETA panel */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_16px_36px_-18px_rgba(0,0,0,0.35)] backdrop-blur-md dark:border-white/5 dark:bg-neutral-900/90 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_16px_36px_-18px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2.5">
          <span className="bg-brand/15 text-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
            <Icon name="navigation" size={14} />
          </span>
          <div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {t("map.distance")}
            </p>
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
              {distanceValue}
            </p>
          </div>
        </div>
        <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-800" />
        <div className="flex items-center gap-2.5">
          <span className="bg-brand/15 text-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
            <Icon name="clock" size={14} />
          </span>
          <div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{t("map.eta")}</p>
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{etaValue}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
