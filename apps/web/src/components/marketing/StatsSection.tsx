export interface StatItem {
  value: string;
  label: string;
}

export function StatsSection({ stats }: { stats: StatItem[] }) {
  return (
    <div className="tablet:grid-cols-4 grid grid-cols-2 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="shadow-elevation1 flex flex-col items-center gap-1 rounded-2xl border border-neutral-100 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900"
        >
          <span className="from-brand to-brand-700 tablet:text-4xl bg-gradient-to-br bg-clip-text text-3xl font-bold text-transparent">
            {stat.value}
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
