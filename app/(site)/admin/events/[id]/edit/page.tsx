import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EditEvent, EventFormSkeleton } from "@/components/admin/edit-event";

export const metadata: Metadata = { title: "Edit event" };

export default function EditEventPage({ params }: PageProps<"/admin/events/[id]/edit">) {
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
          Edit event <span aria-hidden>✏️</span>
        </h1>
      </div>
      <Suspense fallback={<EventFormSkeleton />}>
        <EditEventForId params={params} />
      </Suspense>
    </div>
  );
}

async function EditEventForId({ params }: Pick<PageProps<"/admin/events/[id]/edit">, "params">) {
  const { id } = await params;
  return <EditEvent id={id} />;
}
