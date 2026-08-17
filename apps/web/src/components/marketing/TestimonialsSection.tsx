"use client";

import { Avatar, Icon } from "@the-ride/ui";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export interface Testimonial {
  name: string;
  role: string;
  city: string;
  country?: string;
  photoUrl?: string;
  trips: number;
  quote: string;
  rating: number;
}

/**
 * HOME-07B — bundled default portraits (see docs/testimonials-media-license.md)
 * shown whenever a testimonial has no CMS-uploaded `photoUrl` of its own.
 * Assigned by rotating index so the same testimonial consistently shows the
 * same default portrait — these are decorative defaults, never implied to be
 * the actual reviewer. A CMS photo always takes priority; the shared
 * `Avatar` component's own initials fallback is the final safety net if an
 * image (CMS or bundled) fails to load.
 */
const BUNDLED_PORTRAITS = [
  "/media/testimonials/portrait-1.jpg",
  "/media/testimonials/portrait-2.jpg",
  "/media/testimonials/portrait-3.jpg",
  "/media/testimonials/portrait-4.jpg",
];

/** Auto-sliding testimonial carousel (Sprint 7, given real default portrait photography in HOME-07B). */
export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || testimonials.length <= 1) return;
    const id = window.setInterval(
      () => setIndex((current) => (current + 1) % testimonials.length),
      6000,
    );
    return () => window.clearInterval(id);
  }, [paused, testimonials.length]);

  const testimonial = testimonials[index];
  if (!testimonial) return null;
  const photoUrl = testimonial.photoUrl ?? BUNDLED_PORTRAITS[index % BUNDLED_PORTRAITS.length];

  return (
    <div
      className="mx-auto max-w-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="tablet:min-h-[320px] relative min-h-[340px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="tablet:px-12 relative flex flex-col items-center gap-5 rounded-3xl border border-neutral-100 bg-white px-6 py-10 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7),0_1px_0_0_rgba(232,106,47,0.08),0_20px_44px_-20px_rgba(0,0,0,0.18)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_1px_0_0_rgba(232,106,47,0.12),0_20px_44px_-20px_rgba(0,0,0,0.5)]"
          >
            <span className="from-brand to-brand-700 shadow-elevation2 rounded-full bg-gradient-to-br p-[3px]">
              <Avatar
                src={photoUrl}
                alt={testimonial.name}
                fallback={testimonial.name.charAt(0)}
                className="h-20 w-20 bg-white text-2xl dark:bg-neutral-900"
              />
            </span>

            <div className="text-brand flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon
                  key={i}
                  name="star"
                  size={16}
                  className={
                    i < testimonial.rating
                      ? "fill-current"
                      : "text-neutral-300 dark:text-neutral-700"
                  }
                />
              ))}
            </div>

            <p className="text-brand/25 dark:text-brand/20 font-serif text-5xl leading-[0.5]">
              &ldquo;
            </p>
            <p className="-mt-4 max-w-xl text-lg font-medium leading-relaxed text-neutral-700 dark:text-neutral-300">
              {testimonial.quote}
            </p>

            <div className="mt-1 flex flex-col items-center gap-1">
              <p className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                {testimonial.name}
              </p>
              <p className="text-brand text-xs font-semibold uppercase tracking-wide">
                {testimonial.role}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {testimonial.city}
                {testimonial.country ? `, ${testimonial.country}` : ""} · {testimonial.trips}+ trips
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-7 flex justify-center gap-2.5">
        {testimonials.map((item, i) => (
          <button
            key={item.name}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show testimonial ${i + 1}`}
            aria-current={i === index}
            className={`h-2.5 min-w-[10px] rounded-full transition-all duration-300 ${i === index ? "bg-brand w-7" : "hover:bg-brand/50 w-2.5 bg-neutral-300 dark:bg-neutral-700"}`}
          />
        ))}
      </div>
    </div>
  );
}
