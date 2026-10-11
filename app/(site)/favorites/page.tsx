import type { Metadata } from "next";
import { Suspense } from "react";
import { FavoritesPicker } from "@/components/events/favorites-picker";

export const metadata: Metadata = { title: "Your favourite categories" };

export default function FavoritesPage() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8">
      <div className="grid gap-2">
        <h1 className="text-4xl leading-none font-extrabold sm:text-6xl">
          What are you into? <span aria-hidden>🎯</span>
        </h1>
        <p className="max-w-xl text-muted">Pick your favourite categories. Your feed will only show upcoming events from these.</p>
      </div>
      <Suspense fallback={<div className="card-pop h-56 animate-pulse" aria-hidden />}>
        <FavoritesPicker />
      </Suspense>
    </div>
  );
}
