import { CircleAlert, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { EventCard } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { VisitorEventDTO } from "@/lib/events/types";

const GRID = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";

export function EventGrid({
  events,
  authenticated,
}: {
  events: VisitorEventDTO[];
  authenticated: boolean;
}) {
  return (
    <ul className={GRID}>
      {events.map((event) => (
        <li key={event.id} className="flex">
          <EventCard event={event} authenticated={authenticated} />
        </li>
      ))}
    </ul>
  );
}

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className={cn(GRID, "animate-pulse")} aria-label="Loading events">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="card-pop overflow-hidden">
          <div className="aspect-[16/10] border-b-2 border-ink bg-ink/10" />
          <div className="grid gap-3 p-4">
            <div className="h-5 w-20 rounded-full bg-ink/10" />
            <div className="h-6 w-4/5 rounded-lg bg-ink/10" />
            <div className="h-4 w-1/2 rounded bg-ink/10" />
            <div className="mt-2 flex items-center justify-between">
              <div className="h-7 w-16 rounded bg-ink/10" />
              <div className="h-10 w-28 rounded-xl bg-ink/10" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({
  emoji,
  title,
  children,
  action,
}: {
  emoji: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card-pop grid justify-items-center gap-3 px-6 py-14 text-center">
      <span className="text-5xl" aria-hidden>
        {emoji}
      </span>
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <p className="max-w-md text-muted">{children}</p>
      {action && (
        <div className="mt-2 flex flex-wrap justify-center gap-3">{action}</div>
      )}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="card-pop grid justify-items-center gap-3 px-6 py-12 text-center"
    >
      <CircleAlert className="size-10 text-danger" aria-hidden />
      <h2 className="text-2xl font-extrabold">Something went sideways</h2>
      <p className="max-w-sm text-muted">{message}</p>
      <Button variant="secondary" onClick={onRetry} className="mt-2">
        <RotateCw className="size-4" aria-hidden />
        Try again
      </Button>
    </div>
  );
}
