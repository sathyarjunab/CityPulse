"use client";

import { ArrowLeft, CircleAlert, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EventForm } from "@/components/admin/event-form";
import { Button, buttonClasses } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { EventDTO } from "@/lib/events/types";
import { useResetOnHide } from "@/lib/hooks/use-reset-on-hide";

type State =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; event: EventDTO; version: number };

export function EditEvent({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useResetOnHide(() => setState({ status: "loading" }));

  // Re-runs whenever the page becomes visible again, so the form always starts from saved data.
  useEffect(() => {
    let ignore = false;
    apiFetch<{ event: EventDTO }>(`/api/admin/events/${id}`)
      .then(({ event }) => {
        if (ignore) return;
        setState((current) => ({
          status: "ready",
          event,
          version: current.status === "ready" ? current.version + 1 : 0,
        }));
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

  if (state.status === "loading") return <EventFormSkeleton />;

  if (state.status === "missing") {
    return (
      <div className="card-pop grid justify-items-center gap-3 px-6 py-14 text-center">
        <span className="text-5xl" aria-hidden>
          🕳️
        </span>
        <h2 className="text-2xl font-extrabold">
          This event doesn&apos;t exist
        </h2>
        <p className="max-w-sm text-muted">
          It may have been mistyped in the link. Pick one from your list
          instead.
        </p>
        <Link
          href="/admin"
          className={buttonClasses({ variant: "secondary", className: "mt-2" })}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to events
        </Link>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="card-pop grid justify-items-center gap-3 px-6 py-12 text-center"
      >
        <CircleAlert className="size-10 text-danger" aria-hidden />
        <h2 className="text-2xl font-extrabold">
          Couldn&apos;t load this event
        </h2>
        <p className="max-w-sm text-muted">{state.message}</p>
        <Button
          variant="secondary"
          className="mt-2"
          onClick={() => {
            setState({ status: "loading" });
            setAttempt((count) => count + 1);
          }}
        >
          <RotateCw className="size-4" aria-hidden />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <EventForm key={`${state.event.id}-${state.version}`} event={state.event} />
  );
}

export function EventFormSkeleton() {
  return (
    <div
      className="grid animate-pulse items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"
      aria-label="Loading event"
    >
      <div className="card-pop grid gap-6 p-5 sm:p-8">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="grid gap-2">
            <div className="h-4 w-24 rounded bg-ink/10" />
            <div className="h-12 rounded-xl bg-ink/10" />
          </div>
        ))}
      </div>
      <div className="card-pop h-80 max-lg:hidden" />
    </div>
  );
}
