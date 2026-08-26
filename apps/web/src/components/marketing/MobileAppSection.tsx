"use client";

import { Button, useTranslation } from "@the-ride/ui";
import { motion } from "framer-motion";

import { ANDROID_PASSENGER_APP_RELEASE } from "@/lib/android-app-release";

import { DownloadAppSection } from "./DownloadAppSection";
import { PhoneMockup } from "./PhoneMockup";
import { QrCodePlaceholder } from "./QrCodePlaceholder";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

/**
 * Stabilization Audit follow-up — the real, working download, alongside the
 * still-inert App Store/Play Store badges above (`DownloadAppSection`,
 * disclosed as "coming soon"). Same pattern as the driver space's
 * `AndroidAppDownloadCard` (`(driver)/driver/page.tsx`): a plain `<a href
 * download>` straight at the signed release APK already served from
 * `apps/web/public/downloads/android/` with the right MIME type
 * (`firebase.json`) — no app-store review needed for a direct sideload.
 */
function AndroidApkDownload() {
  const { t } = useTranslation();
  return (
    <div className="tablet:flex-row tablet:items-center tablet:justify-between shadow-elevation1 flex w-full max-w-md flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div>
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          {ANDROID_PASSENGER_APP_RELEASE.appName}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t("website.landing.androidApkLabel")} · {t("website.landing.androidApkVersionLabel")}{" "}
          {ANDROID_PASSENGER_APP_RELEASE.latestVersion}
        </p>
      </div>
      <Button asChild size="sm">
        <a href={ANDROID_PASSENGER_APP_RELEASE.downloadUrl} download>
          {t("website.landing.downloadAndroidApkCta")}
        </a>
      </Button>
    </div>
  );
}

export function MobileAppSection() {
  const { t } = useTranslation();

  return (
    <section className="from-brand-50 dark:from-brand-900/15 relative overflow-hidden bg-gradient-to-b to-white py-24 dark:to-neutral-950">
      {/* HOME-08 — same decorative-glow language as Hero/Safety/Stats, plus a
          bottom copper wash that carries this section's warmth toward
          Driver CTA's dark card instead of handing off to plain white. */}
      <div
        aria-hidden="true"
        className="bg-brand/10 dark:bg-brand/15 pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="bg-brand/15 dark:bg-brand/20 pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full blur-3xl"
      />
      <div className="laptop:grid-cols-2 relative mx-auto grid max-w-6xl items-center gap-12 px-6">
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
          <div className="flex flex-col gap-2">
            <AndroidApkDownload />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t("website.landing.androidApkNote")}
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7),0_1px_0_0_rgba(232,106,47,0.08),0_12px_28px_-16px_rgba(0,0,0,0.12)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_1px_0_0_rgba(232,106,47,0.1),0_12px_28px_-16px_rgba(0,0,0,0.4)]">
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
