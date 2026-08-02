"use client";

import { Icon, useTranslation } from "@the-ride/ui";
import { motion } from "framer-motion";

/**
 * "Download the app" store badges (Sprint 6, polished in Sprint 7). The
 * native apps aren't published (no EAS build credentials in this
 * environment — see docs/deployment.md), so these are visually complete
 * but inert buttons rather than links to real store listings, disclosed
 * as such via `title`/`aria-disabled`.
 */
export function DownloadAppSection() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {(["appStore", "playStore"] as const).map((store) => (
        <motion.div
          key={store}
          whileHover={{ y: -3, scale: 1.02 }}
          aria-disabled="true"
          title={t("website.landing.appComingSoon")}
          className="shadow-elevation1 hover:shadow-elevation3 flex cursor-not-allowed items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-900 px-5 py-3 opacity-90 transition-shadow dark:border-neutral-700"
        >
          <Icon name="phone" size={26} className="text-white" />
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wide text-neutral-300">
              {t(`website.landing.${store}Eyebrow`)}
            </p>
            <p className="text-sm font-semibold text-white">{t(`website.landing.${store}Name`)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
