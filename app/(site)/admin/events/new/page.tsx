import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";

export const metadata: Metadata = { title: "Add an event" };

export default function NewEventPage() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <Link
          href="/admin"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All events
        </Link>
        <h1 className="text-4xl leading-none font-extrabold sm:text-5xl">
          Add an event <span aria-hidden>✨</span>
        </h1>
      </div>
      <EventForm />
    </div>
  );
}
