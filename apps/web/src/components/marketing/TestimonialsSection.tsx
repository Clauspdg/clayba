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
 * Auto-sliding testimonial carousel (Sprint 7). No licensed portrait
 * photography is available in this environment — avatars are initials on
 * a gradient ring rather than real photos, disclosed here rather than
 * silently faked with `<img>` tags pointed at stock-photo URLs.
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

  return (
    <div
      className="mx-auto max-w-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-[280px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="shadow-elevation2 flex flex-col items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="text-brand flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon
                  key={i}
                  name="star"
                  size={18}
                  className={
                    i < testimonial.rating
                      ? "fill-current"
                      : "text-neutral-300 dark:text-neutral-700"
                  }
                />
              ))}
            </div>
            <p className="text-lg text-neutral-700 dark:text-neutral-300">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <span className="from-brand to-brand-700 rounded-full bg-gradient-to-br p-0.5">
                <Avatar
                  src={testimonial.photoUrl}
                  alt={testimonial.name}
                  fallback={testimonial.name.charAt(0)}
                  className="bg-white dark:bg-neutral-900"
                />
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {testimonial.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {testimonial.role} · {testimonial.city}
                  {testimonial.country ? `, ${testimonial.country}` : ""} · {testimonial.trips}+
                  trips
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {testimonials.map((item, i) => (
          <button
            key={item.name}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show testimonial ${i + 1}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all duration-300 ${i === index ? "bg-brand w-6" : "w-2 bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-700"}`}
          />
        ))}
      </div>
    </div>
  );
}
