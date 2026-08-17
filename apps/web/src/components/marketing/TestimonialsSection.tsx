"use client";

import { Avatar, Icon, cn } from "@the-ride/ui";
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
 * HOME-07B — editorial-premium presentation. Photo priority is strictly
 * CMS-first: a testimonial with its own uploaded `photoUrl` shows that
 * photo; otherwise this renders a redesigned initials monogram — never a
 * stock portrait, which would falsely imply a photographed stranger wrote
 * someone else's review. (An earlier version of this component rotated in
 * bundled stock portraits as a default; that's been removed here.) The
 * shared `Avatar` component's own initials fallback is the final safety
 * net if a real CMS photo URL ever fails to load.
 */
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

  const hasPhoto = Boolean(testimonial.photoUrl);
  const initials =
    testimonial.name
      .split(" ")
      .map((part) => part.charAt(0))
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || testimonial.name.charAt(0);

  return (
    <div
      className="mx-auto max-w-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="tablet:min-h-[340px] relative min-h-[380px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="tablet:px-14 tablet:py-12 relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-neutral-100 bg-white px-7 py-12 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7),0_1px_0_0_rgba(232,106,47,0.08),0_20px_44px_-20px_rgba(0,0,0,0.18)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_1px_0_0_rgba(232,106,47,0.12),0_20px_44px_-20px_rgba(0,0,0,0.5)]"
          >
            {/* Restrained glass accent — a soft copper glow, purely decorative. */}
            <div
              aria-hidden="true"
              className="bg-brand/10 dark:bg-brand/15 pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl"
            />

            <span className="from-brand to-brand-700 shadow-elevation2 relative rounded-full bg-gradient-to-br p-[3px]">
              <Avatar
                src={testimonial.photoUrl}
                alt={testimonial.name}
                fallback={initials}
                className={cn(
                  "h-20 w-20 text-xl font-semibold tracking-wide",
                  hasPhoto
                    ? "bg-white dark:bg-neutral-900"
                    : "text-brand-300 bg-neutral-900 dark:bg-neutral-950",
                )}
              />
            </span>

            <div className="text-brand relative flex gap-0.5">
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

            <div className="relative flex flex-col items-center gap-1">
              <p className="text-brand/20 dark:text-brand/25 pointer-events-none select-none font-serif text-6xl leading-[0.3]">
                &ldquo;
              </p>
              <p className="tablet:text-2xl -mt-2 max-w-xl text-xl font-medium leading-relaxed tracking-tight text-neutral-800 dark:text-neutral-200">
                {testimonial.quote}
              </p>
            </div>

            <div className="relative mt-2 flex flex-col items-center gap-1.5">
              <span className="via-brand/30 h-px w-10 bg-gradient-to-r from-transparent to-transparent" />
              <p className="mt-2 text-base font-semibold text-neutral-900 dark:text-neutral-50">
                {testimonial.name}
              </p>
              <p className="text-brand text-xs font-semibold uppercase tracking-wide">
                {testimonial.role}
              </p>
              <p className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                <Icon name="mapPin" size={11} className="text-brand-300" />
                {testimonial.city}
                {testimonial.country ? `, ${testimonial.country}` : ""}
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                {testimonial.trips}+ trips
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
