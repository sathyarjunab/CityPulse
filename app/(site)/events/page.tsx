import type { Metadata } from "next";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <div className="grid gap-8">
      <h1 className="text-4xl leading-none font-extrabold sm:text-6xl">
        What&apos;s on <span aria-hidden>🎟️</span>
      </h1>
      <div className="card-pop grid justify-items-center gap-3 px-6 py-14 text-center">
        <span className="text-5xl" aria-hidden>
          🛠️
        </span>
        <h2 className="text-2xl font-extrabold">Events are on their way</h2>
        <p className="max-w-sm text-muted">Upcoming events will show up here soon.</p>
      </div>
    </div>
  );
}
