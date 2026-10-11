"use client";

import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryBadge } from "@/components/category-badge";
import { CardDesigner } from "@/components/events/card-designer";
import { EventImage } from "@/components/event-image";
import { EmptyState, ErrorState } from "@/components/events/event-grid";
import { RemindButton } from "@/components/events/remind-button";
import { buttonClasses } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { VisitorEventDTO } from "@/lib/events/types";
import { formatEventDate, formatPrice } from "@/lib/format";

type State =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      event: VisitorEventDTO;
      authenticated: boolean;
      loadedAt: number;
    };

export function EventDetail({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    apiFetch<{ event: VisitorEventDTO; authenticated: boolean }>(
      `/api/events/${id}`,
    )
      .then(({ event, authenticated }) => {
        if (!ignore)
          setState({
            status: "ready",
            event,
            authenticated,
            loadedAt: Date.now(),
          });
      })
      .catch((error: unknown) => {
        if (ignore) return;
        if (error instanceof ApiClientError && error.status === 404)
          setState({ status: "missing" });
        else
          setState({
            status: "error",
            message:
              error instanceof ApiClientError
                ? error.message
                : "Couldn't load this event.",
          });
      });
    return () => {
      ignore = true;
    };
  }, [id, attempt]);

  if (state.status === "loading") return <EventDetailSkeleton />;

  if (state.status === "missing") {
    return (
      <EmptyState
        emoji="🕳️"
        title="This event isn't listed"
        action={
          <Link
            href="/events"
            className={buttonClasses({ variant: "secondary" })}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Browse events
          </Link>
        }
      >
        It may have been taken down or the link is wrong. There&apos;s plenty
        more on.
      </EmptyState>
    );
  }

  if (state.status === "error") {
    return (
      <ErrorState
        message={state.message}
        onRetry={() => {
          setState({ status: "loading" });
          setAttempt((count) => count + 1);
        }}
      />
    );
  }

  const { event, authenticated, loadedAt } = state;
  const hasEnded = new Date(event.startsAt).getTime() < loadedAt;

  return (
    <div className="grid gap-14">
      <article className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <title>{`${event.title} · CityPulse`}</title>
        <div className="lg:sticky lg:top-28">
          <EventImage
            src={event.imageUrl}
            alt={event.title}
            sizes="(min-width: 1024px) 600px, 100vw"
            priority
            className="card-pop aspect-[4/3]"
          />
        </div>

        <div className="grid gap-6">
          <div className="grid gap-3">
            <CategoryBadge
              category={event.category}
              className="justify-self-start"
            />
            <h1 className="text-4xl leading-[1.05] font-extrabold break-words sm:text-5xl">
              {event.title}
            </h1>
          </div>

          <dl className="card-pop grid gap-3 p-5">
            <div className="flex items-center gap-3">
              <dt className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-lime">
                <CalendarDays className="size-5" aria-hidden />
                <span className="sr-only">Date and time</span>
              </dt>
              <dd className="font-bold">{formatEventDate(event.startsAt)}</dd>
            </div>
            <div className="flex items-center gap-3">
              <dt className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-sky">
                <MapPin className="size-5" aria-hidden />
                <span className="sr-only">City</span>
              </dt>
              <dd className="font-bold">{event.city}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t-2 border-dashed border-ink/15 pt-4">
              <dt className="sr-only">Price</dt>
              <dd className="font-display text-3xl font-extrabold">
                {formatPrice(event.price)}
              </dd>
              {hasEnded ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-ink/30 px-3 py-2 text-sm font-bold text-muted">
                  <Clock className="size-4" aria-hidden />
                  This event has ended
                </span>
              ) : (
                <RemindButton
                  key={`${event.id}:${event.remindedByMe}`}
                  eventId={event.id}
                  eventTitle={event.title}
                  initialReminded={event.remindedByMe}
                  authenticated={authenticated}
                  size="md"
                />
              )}
            </div>
          </dl>

          <section className="grid gap-2">
            <h2 className="text-2xl font-extrabold">About this event</h2>
            <p className="leading-relaxed whitespace-pre-line text-ink/85">
              {event.description}
            </p>
          </section>
        </div>
      </article>
      <CardDesigner
        key={event.id}
        event={event}
        authenticated={authenticated}
      />
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <div
      className="grid animate-pulse items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
      aria-label="Loading event"
    >
      <div className="card-pop aspect-[4/3] bg-ink/10" />
      <div className="grid gap-6">
        <div className="grid gap-3">
          <div className="h-6 w-24 rounded-full bg-ink/10" />
          <div className="h-12 w-4/5 rounded-xl bg-ink/10" />
        </div>
        <div className="card-pop h-48" />
        <div className="grid gap-2">
          <div className="h-4 w-full rounded bg-ink/10" />
          <div className="h-4 w-11/12 rounded bg-ink/10" />
          <div className="h-4 w-2/3 rounded bg-ink/10" />
        </div>
      </div>
    </div>
  );
}
