"use client";

import { Icon, type IconName } from "@the-ride/ui";
import { motion } from "framer-motion";

export interface ProcessStep {
  icon: IconName;
  title: string;
  description: string;
}

export function ProcessSteps({ steps }: { steps: ProcessStep[] }) {
  return (
    <div className="tablet:grid-cols-3 relative grid gap-8">
      {/* Connecting progress line (desktop only) — drawn once, in view. */}
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
          className="relative flex flex-col items-center gap-3 text-center"
        >
          <div className="from-brand to-brand-700 shadow-elevation2 duration-normal relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white transition-shadow hover:shadow-[0_0_30px_-5px_rgba(232,106,47,0.6)]">
            <Icon name={step.icon} size={26} />
            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white dark:bg-neutral-50 dark:text-neutral-900">
              {index + 1}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {step.title}
          </h3>
          <p className="max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
            {step.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
