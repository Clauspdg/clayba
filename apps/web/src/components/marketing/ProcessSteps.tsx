"use client";

import { Icon, type IconName } from "@the-ride/ui";
import { motion } from "framer-motion";
import { useState } from "react";

export interface ProcessStep {
  icon: IconName;
  title: string;
  description: string;
  imageUrl?: string;
}

/**
 * HOME-06B — bundled default photography for the first three steps
 * (Request → Ride → Arrive), shown whenever a step has no CMS-published
 * image of its own (see docs/how-it-works-media-license.md for sources/
 * licenses). Priority per step: CMS `imageUrl` -> bundled default below
 * (by position, steps 1-3 only) -> the original icon-tile treatment for
 * any step beyond that, or if the resolved image URL fails to load.
 */
const BUNDLED_STEP_IMAGES = [
  "/media/how-it-works/request.jpg",
  "/media/how-it-works/ride.jpg",
  "/media/how-it-works/arrive.jpg",
];

export function ProcessSteps({ steps }: { steps: ProcessStep[] }) {
  return (
    <div className="tablet:grid-cols-3 relative grid gap-8">
      {/* Connecting progress line (desktop only) — aligned with the step-number badges (top-8 = the badges' vertical center). */}
      <motion.div
        aria-hidden="true"
        className="from-brand via-brand-400 to-brand tablet:block absolute left-[16.5%] right-[16.5%] top-8 hidden h-0.5 origin-left bg-gradient-to-r"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      />
      {steps.map((step, index) => (
        <motion.div
          key={step.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: index * 0.15 }}
          whileHover={{ y: -4 }}
          className="group relative flex flex-col gap-4"
        >
          <StepMedia
            icon={step.icon}
            index={index}
            imageUrl={step.imageUrl ?? BUNDLED_STEP_IMAGES[index]}
          />
          <div className="flex flex-col items-center gap-2 px-2 text-center">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {step.title}
            </h3>
            <p className="max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
              {step.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/** Photo-first step tile with a numbered badge; falls back to the original icon treatment when no image is available or it fails to load. */
function StepMedia({
  icon,
  index,
  imageUrl,
}: {
  icon: IconName;
  index: number;
  imageUrl?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(imageUrl) && !failed;

  return (
    <div className="shadow-elevation1 duration-normal hover:shadow-elevation2 relative aspect-square w-full overflow-hidden rounded-3xl border border-neutral-100 transition-shadow dark:border-neutral-800">
      {showPhoto ? (
        <img
          src={imageUrl}
          alt=""
          className="duration-normal h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="from-brand-50 to-brand-100 text-brand dark:from-brand-900 dark:to-brand-800 dark:text-brand-300 flex h-full w-full items-center justify-center bg-gradient-to-br">
          <Icon name={icon} size={40} />
        </div>
      )}
      <div className="ring-brand/40 duration-normal pointer-events-none absolute inset-0 rounded-3xl ring-0 ring-inset transition-all group-hover:ring-2" />
      <span className="from-brand to-brand-700 shadow-elevation2 absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ring-2 ring-white/80 dark:ring-neutral-900/80">
        {index + 1}
      </span>
    </div>
  );
}
