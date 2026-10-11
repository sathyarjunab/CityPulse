import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EventDetail, EventDetailSkeleton } from "@/components/events/event-detail";

export const metadata: Metadata = { title: "Event" };

export default function EventPage({ params }: PageProps<"/events/[id]">) {
  return (
    <div className="grid gap-6">
      <Link
        href="/events"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All events
      </Link>
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventDetailForId params={params} />
      </Suspense>
    </div>
  );
}

async function EventDetailForId({ params }: Pick<PageProps<"/events/[id]">, "params">) {
  const { id } = await params;
  return <EventDetail id={id} />;
}
