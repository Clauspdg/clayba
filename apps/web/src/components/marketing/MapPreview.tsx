"use client";

import { Icon, useTranslation } from "@the-ride/ui";
import { motion } from "framer-motion";

const ROUTE_PATH = "M60 220 C 140 220, 140 100, 220 100 S 320 60, 340 60";

/**
 * Map placeholder (Sprint 6, animated further in Sprint 7: "trajet animé,
 * voiture animée"). No Maps/geocoding API key is configured in this
 * environment (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is empty) — this is a
 * styled, animated illustrative route rather than a real embedded map,
 * clearly presented as a preview with simulated distance/ETA data, not a
 * working map widget.
 */
export interface MapPreviewProps {
  distanceValue?: string;
  etaValue?: string;
}

export function MapPreview({ distanceValue = "12.4 km", etaValue = "18 min" }: MapPreviewProps) {
  const { t } = useTranslation();

  return (
    <div className="shadow-elevation2 relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(#D3CCC2 1px, transparent 1px), linear-gradient(90deg, #D3CCC2 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <motion.path
          d={ROUTE_PATH}
          fill="none"
          stroke="#E86A2F"
          strokeWidth="4"
          strokeDasharray="2 10"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />
        <g>
          <circle r="7" fill="#232323" stroke="white" strokeWidth="2">
            <animateMotion dur="4s" repeatCount="indefinite" path={ROUTE_PATH} rotate="auto" />
          </circle>
        </g>
      </svg>
      <div className="absolute left-[13%] top-[68%] flex flex-col items-center">
        <span className="shadow-elevation2 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white">
          <Icon name="mapPin" size={18} />
        </span>
        <span className="shadow-elevation1 mt-1 rounded-full bg-white px-2 py-0.5 text-xs font-medium dark:bg-neutral-900 dark:text-neutral-50">
          {t("map.pickup")}
        </span>
      </div>
      <div className="absolute right-[13%] top-[16%] flex flex-col items-center">
        <span className="bg-brand shadow-elevation2 flex h-9 w-9 items-center justify-center rounded-full text-white">
          <Icon name="flag" size={16} />
        </span>
        <span className="shadow-elevation1 mt-1 rounded-full bg-white px-2 py-0.5 text-xs font-medium dark:bg-neutral-900 dark:text-neutral-50">
          {t("map.destination")}
        </span>
      </div>
      <div className="shadow-elevation2 absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 backdrop-blur dark:bg-neutral-900/90">
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("map.distance")}</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {distanceValue}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("map.eta")}</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{etaValue}</p>
        </div>
      </div>
    </div>
  );
}
