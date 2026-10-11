import type { Metadata } from "next";
import { Suspense } from "react";
import { EventGridSkeleton } from "@/components/events/event-grid";
import { FeedView } from "@/components/events/feed-view";

export const metadata: Metadata = { title: "My feed" };

export default function FeedPage() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="text-4xl leading-none font-extrabold sm:text-6xl">
          My feed <span aria-hidden>💖</span>
        </h1>
        <p className="max-w-xl text-muted">Upcoming events from the categories you love.</p>
      </div>
      <Suspense fallback={<EventGridSkeleton />}>
        <FeedView />
      </Suspense>
    </div>
  );
}
