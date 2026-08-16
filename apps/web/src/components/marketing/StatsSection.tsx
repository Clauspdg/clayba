export interface StatItem {
  value: string;
  label: string;
}

/**
 * HOME-05A — premium surface treatment continuing the visual language
 * established by the Navbar/Hero/Booking Card (HOME-02/03/04): an inset
 * top highlight + a whisper-thin copper accent line built into the
 * card's own shadow stack (not a border color swap), a decorative
 * copper glow that only reveals on hover, and a bolder/tighter number
 * next to a small uppercase micro-label for clearer value/label
 * hierarchy. Grid structure, CMS content, and responsive columns are
 * unchanged — only the card's own surface, typography, and hover state
 * changed. Every shadow color here is a raw rgba() inside an arbitrary
 * bracket value, not Tailwind's bg/border opacity-fraction shorthand —
 * deliberately avoiding that shorthand for any *new* fraction, since a
 * from-scratch fraction (e.g. a color/opacity combo never used
 * elsewhere in the codebase) was found to silently fail to compile in
 * production during HOME-04's QA pass.
 */
export function StatsSection({ stats }: { stats: StatItem[] }) {
  return (
    <div className="tablet:grid-cols-4 tablet:gap-6 grid grid-cols-2 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="tablet:p-6 hover:border-brand/25 group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7),0_1px_0_0_rgba(232,106,47,0.08),0_12px_28px_-16px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),0_1px_0_0_rgba(232,106,47,0.18),0_20px_40px_-16px_rgba(232,106,47,0.3)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_1px_0_0_rgba(232,106,47,0.1),0_12px_28px_-16px_rgba(0,0,0,0.4)] dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_1px_0_0_rgba(232,106,47,0.2),0_20px_40px_-16px_rgba(232,106,47,0.35)]"
        >
          {/* Decorative copper glow — hidden until hover, so pointer
              devices get the "controlled glow" call-out without adding
              any always-on visual noise on touch. */}
          <div
            aria-hidden="true"
            className="bg-brand/10 pointer-events-none absolute -top-8 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
          />
          <span className="from-brand to-brand-700 tablet:text-4xl relative bg-gradient-to-br bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            {stat.value}
          </span>
          <span className="relative text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
