"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Category } from "@/app/generated/prisma/enums";
import {
  EmptyState,
  ErrorState,
  EventGrid,
  EventGridSkeleton,
} from "@/components/events/event-grid";
import { Pagination } from "@/components/events/pagination";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { CATEGORIES, CATEGORY_META } from "@/lib/categories";
import { cn } from "@/lib/cn";
import type { EventPageDTO } from "@/lib/events/types";
import { useResetOnHide } from "@/lib/hooks/use-reset-on-hide";

type Filters = { category?: Category; city?: string; q?: string; page: number };

type LoadState =
  | { status: "loading"; key: null }
  | { status: "ready"; key: string; data: EventPageDTO }
  | { status: "error"; key: string; message: string };

const SEARCH_DELAY_MS = 350;

function readFilters(params: URLSearchParams): Filters {
  const category = params.get("category");
  const page = Number(params.get("page"));
  return {
    category:
      category && category in CATEGORY_META
        ? (category as Category)
        : undefined,
    city: params.get("city")?.trim() || undefined,
    q: params.get("q")?.trim() || undefined,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

function toQueryString({ category, city, q, page }: Filters) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (city) params.set("city", city);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  return params.toString();
}

// Filters live in the URL, so they combine, survive a refresh and can be shared.
export function EventsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = readFilters(searchParams);
  const queryKey = toQueryString(filters);

  const [state, setState] = useState<LoadState>({
    status: "loading",
    key: null,
  });
  const [attempt, setAttempt] = useState(0);
  useResetOnHide(() => setState({ status: "loading", key: null }));
  const [cities, setCities] = useState<string[]>([]);
  const [searchText, setSearchText] = useState(filters.q ?? "");
  const [syncedQ, setSyncedQ] = useState(filters.q ?? "");
  const resultsRef = useRef<HTMLDivElement>(null);

  // Keep the search box in step when the URL changes from elsewhere (back button, Clear filters).
  if ((filters.q ?? "") !== syncedQ) {
    setSyncedQ(filters.q ?? "");
    setSearchText(filters.q ?? "");
  }

  function navigate(next: Filters, { push = false } = {}) {
    const query = toQueryString(next);
    const url = query ? `${pathname}?${query}` : pathname;
    if (push) router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
  }

  function setFilter(changes: Partial<Omit<Filters, "page">>) {
    navigate({ ...filters, ...changes, page: 1 });
  }

  function goToPage(page: number) {
    navigate({ ...filters, page }, { push: true });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearFilters() {
    setSearchText("");
    navigate({ page: 1 });
  }

  useEffect(() => {
    const q = searchText.trim();
    if (q === (filters.q ?? "")) return;
    const timer = setTimeout(
      () => setFilter({ q: q || undefined }),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  });

  useEffect(() => {
    let ignore = false;
    apiFetch<{ cities: string[] }>("/api/events/cities")
      .then(({ cities }) => {
        if (!ignore) setCities(cities);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    apiFetch<EventPageDTO>(`/api/events?${queryKey}`)
      .then((data) => {
        if (!ignore) setState({ status: "ready", key: queryKey, data });
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setState({
          status: "error",
          key: queryKey,
          message:
            error instanceof ApiClientError
              ? error.message
              : "Couldn't load events.",
        });
      });
    return () => {
      ignore = true;
    };
  }, [queryKey, attempt]);

  const hasFilters = Boolean(filters.category || filters.city || filters.q);
  const isStale = state.key !== queryKey;
  const cityOptions =
    filters.city && !cities.includes(filters.city)
      ? [filters.city, ...cities]
      : cities;

  return (
    <div className="grid gap-8">
      <section className="card-pop grid gap-4 p-4 sm:p-5" aria-label="Filters">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search events, e.g. night, jazz, workshop"
              aria-label="Search events"
              maxLength={100}
              className="h-12 w-full rounded-xl border-2 border-ink bg-white pr-11 pl-12 text-base outline-none transition-shadow placeholder:text-muted/70 focus:shadow-pop-violet [&::-webkit-search-cancel-button]:hidden"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-paper hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>
          <select
            value={filters.city ?? ""}
            onChange={(event) =>
              setFilter({ city: event.target.value || undefined })
            }
            aria-label="City"
            className="h-12 w-full cursor-pointer rounded-xl border-2 border-ink bg-white px-4 text-base font-medium outline-none transition-shadow focus:shadow-pop-violet"
          >
            <option value="">All cities</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div
          className="flex flex-wrap gap-2 pt-1 pb-1"
          role="radiogroup"
          aria-label="Category"
        >
          <CategoryChip
            selected={!filters.category}
            onSelect={() => setFilter({ category: undefined })}
            label="All"
            emoji="✨"
          />
          {CATEGORIES.map((category) => (
            <CategoryChip
              key={category.value}
              selected={filters.category === category.value}
              onSelect={() => setFilter({ category: category.value })}
              label={category.label}
              emoji={category.emoji}
              selectedClassName={category.className}
            />
          ))}
        </div>
      </section>

      <div ref={resultsRef} className="grid scroll-mt-28 gap-6">
        <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
          <p className="font-bold" aria-live="polite">
            {state.status === "ready" &&
              !isStale &&
              (state.data.total === 1
                ? "1 event"
                : `${state.data.total} events`)}
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="size-4" aria-hidden />
              Clear filters
            </Button>
          )}
        </div>

        {isStale && <EventGridSkeleton />}

        {state.status === "error" && !isStale && (
          <ErrorState
            message={state.message}
            onRetry={() => {
              setState({ status: "loading", key: null });
              setAttempt((count) => count + 1);
            }}
          />
        )}

        {state.status === "ready" && !isStale && (
          <ResultsView
            data={state.data}
            hasFilters={hasFilters}
            onClear={clearFilters}
            onPageChange={goToPage}
          />
        )}
      </div>
    </div>
  );
}

function ResultsView({
  data,
  hasFilters,
  onClear,
  onPageChange,
}: {
  data: EventPageDTO;
  hasFilters: boolean;
  onClear: () => void;
  onPageChange: (page: number) => void;
}) {
  if (data.events.length === 0) {
    if (data.total > 0) {
      return (
        <EmptyState
          emoji="📭"
          title="Nothing on this page"
          action={<Button onClick={() => onPageChange(1)}>Go to page 1</Button>}
        >
          This page is past the end of the list.
        </EmptyState>
      );
    }
    return hasFilters ? (
      <EmptyState
        emoji="🔍"
        title="No events match"
        action={<Button onClick={onClear}>Clear filters</Button>}
      >
        Try another city, a different category or a shorter search.
      </EmptyState>
    ) : (
      <EmptyState emoji="🌙" title="Nothing on the calendar yet">
        New events land here as soon as they&apos;re announced. Check back soon.
      </EmptyState>
    );
  }

  return (
    <>
      <EventGrid events={data.events} authenticated={data.authenticated} />
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
}

function CategoryChip({
  selected,
  onSelect,
  label,
  emoji,
  selectedClassName = "bg-ink text-paper",
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  emoji: string;
  selectedClassName?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink px-4 py-2 text-sm font-bold transition-[transform,box-shadow,background-color] duration-150",
        selected
          ? `${selectedClassName} -translate-x-0.5 -translate-y-0.5 shadow-pop-sm`
          : "bg-white hover:bg-paper",
      )}
    >
      <span aria-hidden>{emoji}</span>
      {label}
    </button>
  );
}
