import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export interface UseTableStateOptions<T> {
  data: T[];
  /** Which fields a free-text search checks (stringified, case-insensitive). */
  searchFields?: Array<keyof T>;
  pageSize?: number;
}

export interface UseTableStateResult<T> {
  search: string;
  setSearch: (value: string) => void;
  filters: Partial<Record<keyof T, string>>;
  setFilter: (key: keyof T, value: string) => void;
  clearFilters: () => void;
  sortKey: keyof T | null;
  sortDirection: SortDirection;
  toggleSort: (key: keyof T) => void;
  page: number;
  setPage: (page: number) => void;
  pageCount: number;
  pageItems: T[];
  totalCount: number;
}

/**
 * Generic client-side table state (Web Phase W1, Part 7: "sorting,
 * filtering, searching, pagination") — every admin list page reads live
 * Firestore data into a plain array and hands it to this hook rather than
 * re-implementing the same state machine per page. Client-side because
 * these lists are small enough (hundreds, not millions, of rows) that a
 * server-side paginated query would be premature — see docs/design-system.md.
 */
export function useTableState<T>({
  data,
  searchFields = [],
  pageSize = 10,
}: UseTableStateOptions<T>): UseTableStateResult<T> {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Partial<Record<keyof T, string>>>({});
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);

  function setFilter(key: keyof T, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({});
    setPage(1);
  }

  function toggleSort(key: keyof T) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
    } else {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    }
  }

  const filtered = useMemo(() => {
    let result = data;

    if (search.trim() && searchFields.length > 0) {
      const needle = search.trim().toLowerCase();
      result = result.filter((row) =>
        searchFields.some((field) =>
          String(row[field] ?? "")
            .toLowerCase()
            .includes(needle),
        ),
      );
    }

    for (const [key, value] of Object.entries(filters) as Array<[keyof T, string | undefined]>) {
      if (value) {
        result = result.filter((row) => String(row[key] ?? "") === value);
      }
    }

    if (sortKey) {
      const direction = sortDirection === "asc" ? 1 : -1;
      result = [...result].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av === bv) return 0;
        return (av! > bv! ? 1 : -1) * direction;
      });
    }

    return result;
  }, [data, search, searchFields, filters, sortKey, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  return {
    search,
    setSearch: (value) => {
      setSearch(value);
      setPage(1);
    },
    filters,
    setFilter,
    clearFilters,
    sortKey,
    sortDirection,
    toggleSort,
    page: clampedPage,
    setPage,
    pageCount,
    pageItems,
    totalCount: filtered.length,
  };
}
