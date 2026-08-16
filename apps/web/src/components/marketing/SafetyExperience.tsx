"use client";

import type { ResolvedSafetyCard } from "@/hooks/useSiteContent";
import { Badge, Button, Icon, cn, useTranslation, type IconName } from "@the-ride/ui";
import { motion } from "framer-motion";
import Link from "next/link";

import { Reveal } from "./Reveal";

export interface SafetyExperienceProps {
  cards: ResolvedSafetyCard[];
  ctaLabel: string;
  ctaHref: string;
}

/**
 * HOME-07A — one featured safety experience (the real-time-tracking card,
 * paired with an illustrative trip-status timeline built from the actual
 * `tripStatus` enum copy) plus the remaining cards as smaller supporting
 * capability cards, instead of three identical generic tiles. Card
 * content/copy is untouched — only the layout and the added trip-status
 * illustration are new. See docs/safety-experience-audit.md for exactly
 * which shown capabilities are real vs. illustrative.
 */
export function SafetyExperience({ cards, ctaLabel, ctaHref }: SafetyExperienceProps) {
  const featured = cards.find((card) => card.icon === "mapPin") ?? cards[0];
  const supporting = cards.filter((card) => card !== featured);

  return (
    <div>
      <div className="laptop:grid-cols-[1.15fr_1fr] grid gap-6">
        {featured && (
          <Reveal>
            <FeaturedSafetyPanel card={featured} />
          </Reveal>
        )}
        <div className="flex flex-col gap-6">
          {supporting.map((card, index) => (
            <Reveal key={card.title} delay={index * 0.1}>
              <SupportingSafetyCard card={card} />
            </Reveal>
          ))}
        </div>
      </div>
      <div className="mt-10 text-center">
        <Button
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10 hover:text-white"
          asChild
        >
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}

const TRIP_STATUS_STEPS = ["matched", "en_route_to_pickup", "arrived", "in_progress"] as const;
/** Index of the "current" step in the illustrative example — everything before is complete, everything after is upcoming. */
const EXAMPLE_CURRENT_STEP_INDEX = 1;

function FeaturedSafetyPanel({ card }: { card: ResolvedSafetyCard }) {
  const { t } = useTranslation();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="tablet:p-8 relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="bg-brand/20 text-brand-300 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
          <Icon name={card.icon as IconName} size={20} />
        </span>
        {/* Product honesty — this is a static illustrative example, never a real user's live trip. */}
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-300">
          <Icon name="info" size={11} className="text-brand-300" />
          {t("map.previewLabel")}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-semibold text-white">{card.title}</h3>
      <p className="mt-2 max-w-sm text-sm text-neutral-400">{card.description}</p>

      <div className="mt-6 flex flex-1 flex-col justify-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-5">
        <ol className="flex flex-col gap-4">
          {TRIP_STATUS_STEPS.map((status, index) => {
            const isComplete = index < EXAMPLE_CURRENT_STEP_INDEX;
            const isCurrent = index === EXAMPLE_CURRENT_STEP_INDEX;
            return (
              <li key={status} className="flex items-center gap-3">
                <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                  {isCurrent && (
                    <motion.span
                      className="bg-brand/40 absolute inset-0 rounded-full"
                      animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative flex h-6 w-6 items-center justify-center rounded-full",
                      isComplete && "bg-brand text-white",
                      isCurrent && "bg-brand text-white",
                      !isComplete && !isCurrent && "border border-white/20 text-neutral-500",
                    )}
                  >
                    {isComplete ? (
                      <Icon name="check" size={12} />
                    ) : isCurrent ? (
                      <Icon name="car" size={11} />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                </span>
                <span
                  className={cn(
                    "text-sm",
                    isComplete || isCurrent ? "font-medium text-white" : "text-neutral-500",
                  )}
                >
                  {t(`tripStatus.${status}`)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </motion.div>
  );
}

function SupportingSafetyCard({ card }: { card: ResolvedSafetyCard }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="duration-normal group relative flex-1 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-shadow hover:shadow-[0_0_40px_-8px_rgba(232,106,47,0.45)]"
    >
      <span className="bg-brand/20 text-brand-300 group-hover:bg-brand/30 mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-colors">
        <Icon name={card.icon as IconName} size={20} />
      </span>
      <h3 className="mb-2 font-semibold text-white">{card.title}</h3>
      <p className="mb-3 text-sm text-neutral-400">{card.description}</p>
      {/* Decorative verification touchpoints (documents / vehicle / rating) — purely illustrative, no new claims, aria-hidden since the title/description already convey the meaning. */}
      {card.icon === "shieldCheck" && (
        <div className="mb-3 flex items-center gap-2" aria-hidden="true">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-neutral-300">
            <Icon name="fileText" size={12} />
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-neutral-300">
            <Icon name="car" size={12} />
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-neutral-300">
            <Icon name="star" size={12} />
          </span>
        </div>
      )}
      <Badge tone="brand" className="bg-brand/15 text-brand-200">
        <Icon name="shieldCheck" size={12} />
        {card.badgeText}
      </Badge>
    </motion.div>
  );
}
