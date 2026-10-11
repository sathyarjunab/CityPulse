import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { CategoryBadge } from "@/components/category-badge";
import { EventImage } from "@/components/event-image";
import { RemindButton } from "@/components/events/remind-button";
import type { VisitorEventDTO } from "@/lib/events/types";
import { formatEventDate, formatPrice } from "@/lib/format";

export function EventCard({ event, authenticated }: { event: VisitorEventDTO; authenticated: boolean }) {
  return (
    <article className="card-pop group relative flex w-full flex-col overflow-hidden transition-[transform,box-shadow] duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pop-lg">
      <EventImage
        src={event.imageUrl}
        alt=""
        sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
        className="aspect-[16/10] border-b-2 border-ink"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <CategoryBadge category={event.category} className="self-start" />
        <h3 className="text-xl leading-tight font-extrabold">
          <Link
            href={`/events/${event.id}`}
            className="outline-none after:absolute after:inset-0 after:rounded-[1.125rem] focus-visible:after:outline-3 focus-visible:after:outline-offset-2 focus-visible:after:outline-violet"
          >
            {event.title}
          </Link>
        </h3>
        <p className="grid gap-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            {formatEventDate(event.startsAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {event.city}
          </span>
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="font-display text-2xl font-extrabold">{formatPrice(event.price)}</span>
          <RemindButton
            key={`${event.id}:${event.remindedByMe}`}
            eventId={event.id}
            eventTitle={event.title}
            initialReminded={event.remindedByMe}
            authenticated={authenticated}
            className="relative z-10"
          />
        </div>
      </div>
    </article>
  );
}
