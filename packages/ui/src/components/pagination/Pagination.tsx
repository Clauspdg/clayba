import { Icon } from "../icon/Icon";
import { cn } from "../../utils/cn";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  /** e.g. "Page {current} of {total}" already interpolated by the caller. */
  summary?: string;
}

export function Pagination({ page, pageCount, onPageChange, previousLabel, nextLabel, summary }: PaginationProps) {
  return (
    <nav aria-label={summary ?? previousLabel} className="flex items-center justify-between gap-4">
      {summary && <p className="text-sm text-neutral-500 dark:text-neutral-400">{summary}</p>}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={previousLabel}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-700 transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800",
          )}
        >
          <Icon name="chevronLeft" size={16} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label={nextLabel}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-700 transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
    </nav>
  );
}
