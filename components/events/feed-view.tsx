"use client";

import { Pencil, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Category } from "@/app/generated/prisma/enums";
import { CategoryBadge } from "@/components/category-badge";
import { EmptyState, ErrorState, EventGrid, EventGridSkeleton } from "@/components/events/event-grid";
import { Pagination } from "@/components/events/pagination";
import { buttonClasses } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { EventPageDTO } from "@/lib/events/types";

type FeedDTO = EventPageDTO & { favoriteCategories: Category[] };

type LoadState =
  | { status: "loading"; key: null }
  | { status: "ready"; key: string; data: FeedDTO }
  | { status: "error"; key: string; message: string };

const EDIT_PICKS_HREF = "/favorites?next=%2Ffeed";

export function FeedView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawPage = Number(searchParams.get("page"));
  const page = Number.isInteger(rawPage) && rawPage > 1 ? rawPage : 1;
  const queryKey = page > 1 ? `page=${page}` : "";

  const [state, setState] = useState<LoadState>({ status: "loading", key: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    apiFetch<FeedDTO>(`/api/feed?${queryKey}`)
      .then((data) => {
        if (!ignore) setState({ status: "ready", key: queryKey, data });
      })
      .catch((error: unknown) => {
        if (ignore) return;
        if (error instanceof ApiClientError && error.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        setState({
          status: "error",
          key: queryKey,
          message: error instanceof ApiClientError ? error.message : "Couldn't load your feed.",
        });
      });
    return () => {
      ignore = true;
    };
  }, [queryKey, attempt, router, pathname]);

  function goToPage(next: number) {
    router.push(next > 1 ? `${pathname}?page=${next}` : pathname);
  }

  if (state.status === "loading" || (state.status === "error" && state.key !== queryKey)) {
    return <EventGridSkeleton />;
  }

  if (state.status === "error") {
    return (
      <ErrorState
        message={state.message}
        onRetry={() => {
          setState({ status: "loading", key: null });
          setAttempt((count) => count + 1);
        }}
      />
    );
  }

  const { data } = state;

  if (data.favoriteCategories.length === 0) {
    return (
      <EmptyState
        emoji="💫"
        title="Tell us what you're into"
        action={
          <Link href={EDIT_PICKS_HREF} className={buttonClasses()}>
            <Sparkles className="size-5" aria-hidden />
            Pick categories
          </Link>
        }
      >
        Choose a few favourite categories and your feed fills up with events you&apos;ll actually want to go to.
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-muted">Your picks:</span>
        {data.favoriteCategories.map((category) => (
          <CategoryBadge key={category} category={category} />
        ))}
        <Link href={EDIT_PICKS_HREF} className={buttonClasses({ variant: "ghost", size: "sm" })}>
          <Pencil className="size-4" aria-hidden />
          Edit picks
        </Link>
      </div>

      {data.events.length === 0 ? (
        <EmptyState
          emoji="🫥"
          title="Your feed is quiet right now"
          action={
            <>
              <Link href="/events" className={buttonClasses()}>
                Browse all events
              </Link>
              <Link href={EDIT_PICKS_HREF} className={buttonClasses({ variant: "secondary" })}>
                Add more categories
              </Link>
            </>
          }
        >
          {data.total > 0
            ? "This page is past the end of your feed."
            : "No upcoming events in your picks yet. New ones show up here as soon as they're announced."}
        </EmptyState>
      ) : (
        <>
          <p className="font-bold" aria-live="polite">
            {data.total === 1 ? "1 upcoming event" : `${data.total} upcoming events`}
          </p>
          <EventGrid events={data.events} authenticated={data.authenticated} busy={state.key !== queryKey} />
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={goToPage} />
        </>
      )}
    </div>
  );
}
