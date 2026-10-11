import type { Metadata } from "next";
import { Suspense } from "react";
import { EventGridSkeleton } from "@/components/events/event-grid";
import { EventsBrowser } from "@/components/events/events-browser";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="text-4xl leading-none font-extrabold sm:text-6xl">
          What&apos;s on <span aria-hidden>🎟️</span>
        </h1>
        <p className="max-w-xl text-muted">Gigs, workshops, food walks and more, soonest first.</p>
      </div>
      <Suspense fallback={<EventGridSkeleton />}>
        <EventsBrowser />
      </Suspense>
    </div>
  );
}
