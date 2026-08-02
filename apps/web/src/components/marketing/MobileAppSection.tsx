"use client";

import { useTranslation } from "@the-ride/ui";
import { motion } from "framer-motion";

import { DownloadAppSection } from "./DownloadAppSection";
import { PhoneMockup } from "./PhoneMockup";
import { QrCodePlaceholder } from "./QrCodePlaceholder";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function MobileAppSection() {
  const { t } = useTranslation();

  return (
    <section className="from-brand-50 dark:from-brand-900/20 overflow-hidden bg-gradient-to-br to-white py-24 dark:to-neutral-950">
      <div className="laptop:grid-cols-2 mx-auto grid max-w-6xl items-center gap-12 px-6">
        <Reveal variant="scale" className="laptop:order-1 order-2 flex justify-center gap-6">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="-mr-8 mt-8 rotate-[-6deg]"
          >
            <PhoneMockup variant="android" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="z-10 rotate-[4deg]"
          >
            <PhoneMockup variant="ios" />
          </motion.div>
        </Reveal>

        <Reveal className="laptop:order-2 order-1 flex flex-col items-start gap-6">
          <SectionHeading
            align="left"
            eyebrow={t("website.landing.downloadEyebrow")}
            title={t("website.landing.downloadTitle")}
            subtitle={t("website.landing.downloadSubtitle")}
          />
          <DownloadAppSection />
          <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <QrCodePlaceholder size={80} />
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                {t("website.landing.qrTitle")}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("website.landing.qrBody")}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
