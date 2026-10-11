"use client";

import {
  CalendarDays,
  CircleAlert,
  MapPin,
  Pencil,
  Plus,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CategoryBadge } from "@/components/category-badge";
import { EventImage } from "@/components/event-image";
import { Button, buttonClasses } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import type { EventDTO } from "@/lib/events/types";
import { formatEventDate, formatPrice } from "@/lib/format";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; events: EventDTO[]; loadedAt: number };

export function AdminEvents() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [savingIds, setSavingIds] = useState<ReadonlySet<string>>(new Set());
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    apiFetch<{ events: EventDTO[] }>("/api/admin/events")
      .then(({ events }) => {
        if (!ignore)
          setState({ status: "ready", events, loadedAt: Date.now() });
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setState({
          status: "error",
          message:
            error instanceof ApiClientError
              ? error.message
              : "Couldn't load events.",
        });
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((count) => count + 1);
  }

  function patchEvent(id: string, changes: Partial<EventDTO>) {
    setState((current) =>
      current.status === "ready"
        ? {
            ...current,
            events: current.events.map((event) =>
              event.id === id ? { ...event, ...changes } : event,
            ),
          }
        : current,
    );
  }

  function markSaving(id: string, saving: boolean) {
    setSavingIds((current) => {
      const next = new Set(current);
      if (saving) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function setActive(event: EventDTO, isActive: boolean) {
    patchEvent(event.id, { isActive });
    markSaving(event.id, true);
    try {
      const { event: saved } = await apiFetch<{ event: EventDTO }>(
        `/api/admin/events/${event.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive }),
        },
      );
      patchEvent(event.id, saved);
      toast.success(isActive ? "Event is live" : "Event hidden from visitors", {
        description: event.title,
      });
    } catch (error) {
      patchEvent(event.id, { isActive: !isActive });
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Couldn't update the event. Try again.",
        {
          description: event.title,
        },
      );
    } finally {
      markSaving(event.id, false);
    }
  }

  const events = state.status === "ready" ? state.events : [];
  const activeCount = events.filter((event) => event.isActive).length;

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-4xl leading-none font-extrabold sm:text-5xl">
            Your events <span aria-hidden>🗓️</span>
          </h1>
          <p className="text-muted" aria-live="polite">
            {state.status === "ready"
              ? `${events.length} ${events.length === 1 ? "event" : "events"} · ${activeCount} active`
              : "Add events and choose which ones visitors can see."}
          </p>
        </div>
        <Link href="/admin/events/new" className={buttonClasses()}>
          <Plus className="size-5" aria-hidden />
          Add event
        </Link>
      </div>

      {state.status === "loading" && <EventListSkeleton />}

      {state.status === "error" && (
        <div
          role="alert"
          className="card-pop grid justify-items-center gap-3 px-6 py-12 text-center"
        >
          <CircleAlert className="size-10 text-danger" aria-hidden />
          <h2 className="text-2xl font-extrabold">Couldn&apos;t load events</h2>
          <p className="max-w-sm text-muted">{state.message}</p>
          <Button variant="secondary" onClick={retry} className="mt-2">
            <RotateCw className="size-4" aria-hidden />
            Try again
          </Button>
        </div>
      )}

      {state.status === "ready" && events.length === 0 && (
        <div className="card-pop grid justify-items-center gap-3 px-6 py-14 text-center">
          <span className="text-5xl" aria-hidden>
            🎪
          </span>
          <h2 className="text-2xl font-extrabold">No events yet</h2>
          <p className="max-w-sm text-muted">
            Your first event is one form away. Visitors will see it once
            it&apos;s active.
          </p>
          <Link
            href="/admin/events/new"
            className={buttonClasses({ className: "mt-2" })}
          >
            <Plus className="size-5" aria-hidden />
            Add your first event
          </Link>
        </div>
      )}

      {state.status === "ready" && events.length > 0 && (
        <ul className="grid gap-4">
          {events.map((event) => (
            <AdminEventRow
              key={event.id}
              event={event}
              now={state.loadedAt}
              saving={savingIds.has(event.id)}
              onActiveChange={(isActive) => setActive(event, isActive)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminEventRow({
  event,
  now,
  saving,
  onActiveChange,
}: {
  event: EventDTO;
  now: number;
  saving: boolean;
  onActiveChange: (isActive: boolean) => void;
}) {
  const isPast = new Date(event.startsAt).getTime() < now;

  return (
    <li className="card-pop flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:gap-5">
      <EventImage
        src={event.imageUrl}
        alt=""
        sizes="(min-width: 640px) 160px, 100vw"
        className={cn(
          "aspect-video shrink-0 rounded-xl border-2 border-ink transition-[filter] sm:aspect-[4/3] sm:w-40",
          !event.isActive && "grayscale",
        )}
      />

      <div className="grid min-w-0 flex-1 gap-1.5 px-1 sm:px-0">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={event.category} />
          {isPast && (
            <span className="rounded-full border-2 border-ink/30 px-2.5 py-0.5 text-xs font-bold text-muted">
              Past
            </span>
          )}
        </div>
        <h2 className="truncate text-xl font-extrabold" title={event.title}>
          {event.title}
        </h2>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden />
            {formatEventDate(event.startsAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {event.city}
          </span>
          <span className="font-display text-base font-extrabold text-ink">
            {formatPrice(event.price)}
          </span>
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 border-t-2 border-dashed border-ink/15 px-1 pt-3 sm:justify-end sm:border-0 sm:px-2 sm:pt-0">
        <div className="flex items-center gap-3 sm:border-r-2 sm:border-dashed sm:border-ink/15 sm:pr-4">
          <span className="inline-flex w-[5.25rem] items-center gap-2 text-sm font-bold">
            <span
              className={cn(
                "size-2.5 rounded-full border-2 border-ink",
                event.isActive ? "bg-lime" : "bg-white",
              )}
              aria-hidden
            />
            {event.isActive ? "Active" : "Inactive"}
          </span>
          <Switch
            checked={event.isActive}
            onCheckedChange={onActiveChange}
            disabled={saving}
            aria-label={`Show ${event.title} to visitors`}
          />
        </div>
        <Link
          href={`/admin/events/${event.id}/edit`}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          <Pencil className="size-4" aria-hidden />
          Edit<span className="sr-only"> {event.title}</span>
        </Link>
      </div>
    </li>
  );
}

function EventListSkeleton() {
  return (
    <ul className="grid animate-pulse gap-4" aria-label="Loading events">
      {Array.from({ length: 4 }, (_, index) => (
        <li
          key={index}
          className="card-pop flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:gap-5"
        >
          <div className="aspect-video rounded-xl bg-ink/10 sm:aspect-[4/3] sm:w-40" />
          <div className="grid flex-1 gap-2.5">
            <div className="h-5 w-24 rounded-full bg-ink/10" />
            <div className="h-6 w-2/3 rounded-lg bg-ink/10" />
            <div className="h-4 w-1/2 rounded bg-ink/10" />
          </div>
          <div className="h-8 w-14 rounded-full bg-ink/10 max-sm:hidden" />
        </li>
      ))}
    </ul>
  );
}
