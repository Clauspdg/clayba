import { Icon } from "@the-ride/ui";

/**
 * CSS-drawn phone frame with an illustrated app screen inside (Sprint 7:
 * "mockup iPhone / mockup Android, captures de l'application"). No real
 * screenshot exists to capture in this environment — the "screen" is a
 * simplified illustration of the passenger dashboard's real layout
 * (stat cards + a map card), not a photo, disclosed as such.
 */
export function PhoneMockup({
  variant,
  className,
}: {
  variant: "ios" | "android";
  className?: string;
}) {
  const rounded = variant === "ios" ? "rounded-[2.5rem]" : "rounded-[2rem]";

  return (
    <div className={`relative w-56 ${className ?? ""}`}>
      <div
        className={`shadow-elevation4 relative border-[10px] border-neutral-900 bg-neutral-900 ${rounded}`}
      >
        {variant === "ios" && (
          <div className="absolute left-1/2 top-0 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-neutral-900" />
        )}
        <div className="from-brand-50 relative aspect-[9/19] overflow-hidden rounded-[1.75rem] bg-gradient-to-b to-white dark:from-neutral-800 dark:to-neutral-900">
          {/* Illustrated status bar */}
          <div className="flex items-center justify-between px-4 pt-3 text-[9px] font-semibold text-neutral-900 dark:text-neutral-50">
            <span>9:41</span>
            <div className="flex gap-1">
              <Icon name="wallet" size={10} />
            </div>
          </div>
          {/* Illustrated header */}
          <div className="from-brand to-brand-700 mx-3 mt-3 rounded-xl bg-gradient-to-br p-3 text-white">
            <p className="text-[10px] opacity-80">Good evening</p>
            <p className="text-xs font-semibold">Where to?</p>
          </div>
          {/* Illustrated stat chips */}
          <div className="mx-3 mt-2 grid grid-cols-2 gap-2">
            <div className="shadow-elevation1 rounded-lg bg-white p-2 dark:bg-neutral-800">
              <div className="bg-brand h-1.5 w-6 rounded" />
              <div className="mt-1 h-1.5 w-10 rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
            <div className="shadow-elevation1 rounded-lg bg-white p-2 dark:bg-neutral-800">
              <div className="bg-brand h-1.5 w-6 rounded" />
              <div className="mt-1 h-1.5 w-10 rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          </div>
          {/* Illustrated map card */}
          <div className="mx-3 mt-2 flex h-16 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700">
            <Icon name="mapPin" size={16} className="text-brand" />
          </div>
          {/* Illustrated bottom nav */}
          <div className="shadow-elevation2 absolute bottom-2 left-3 right-3 flex justify-between rounded-full bg-white px-4 py-2 dark:bg-neutral-800">
            {["dashboard", "car", "wallet", "user"].map((icon) => (
              <Icon
                key={icon}
                name={icon as "dashboard" | "car" | "wallet" | "user"}
                size={12}
                className="text-neutral-400"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
