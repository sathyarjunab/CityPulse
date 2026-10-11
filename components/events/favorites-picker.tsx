"use client";

import { ArrowRight, Check, CircleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Category } from "@/app/generated/prisma/enums";
import { ErrorState } from "@/components/events/event-grid";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { safeNextPath } from "@/lib/auth/redirect";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/cn";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; saved: Category[] };

export function FavoritesPicker() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next")) ?? "/feed";

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Re-runs whenever the page is shown again, so the picks always start from what's saved.
  useEffect(() => {
    let ignore = false;
    apiFetch<{ favoriteCategories: Category[] }>("/api/me/favorites")
      .then(({ favoriteCategories }) => {
        if (ignore) return;
        setState({ status: "ready", saved: favoriteCategories });
        setSelected(favoriteCategories);
      })
      .catch((loadError: unknown) => {
        if (ignore) return;
        setState({
          status: "error",
          message: loadError instanceof ApiClientError ? loadError.message : "Couldn't load your picks.",
        });
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  function toggle(category: Category) {
    setError(null);
    setSelected((current) =>
      current.includes(category) ? current.filter((value) => value !== category) : [...current, category],
    );
  }

  async function save() {
    if (selected.length === 0) {
      setError("Pick at least one category.");
      return;
    }
    setPending(true);
    try {
      await apiFetch("/api/me/favorites", {
        method: "PUT",
        body: JSON.stringify({ categories: selected }),
      });
      toast.success("Your feed is ready", { description: `${selected.length} ${selected.length === 1 ? "category" : "categories"} picked` });
      setPending(false);
      router.push(next);
    } catch (saveError) {
      toast.error("Couldn't save your picks", {
        description: saveError instanceof ApiClientError ? saveError.message : "Try again in a moment.",
      });
      setPending(false);
    }
  }

  if (state.status === "error") {
    return (
      <ErrorState
        message={state.message}
        onRetry={() => {
          setState({ status: "loading" });
          setAttempt((count) => count + 1);
        }}
      />
    );
  }

  const isFirstTime = state.status === "ready" && state.saved.length === 0;

  return (
    <div className="grid gap-6">
      <div
        role="group"
        aria-label="Favourite categories"
        aria-busy={state.status === "loading" || undefined}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        {CATEGORIES.map((category) => {
          const isSelected = selected.includes(category.value);
          return (
            <button
              key={category.value}
              type="button"
              aria-pressed={isSelected}
              disabled={state.status === "loading"}
              onClick={() => toggle(category.value)}
              className={cn(
                "relative grid aspect-square place-items-center content-center gap-3 rounded-[1.125rem] border-2 border-ink p-4 text-center transition-[transform,box-shadow,background-color] duration-200 disabled:animate-pulse",
                isSelected
                  ? `${category.className} -translate-x-1 -translate-y-1 shadow-pop-lg`
                  : "bg-white shadow-pop hover:-translate-x-0.5 hover:-translate-y-0.5",
              )}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full border-2 border-ink bg-white text-ink">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                </span>
              )}
              <span className="text-5xl transition-transform duration-200" aria-hidden>
                {category.emoji}
              </span>
              <span className="font-display text-lg font-extrabold">{category.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={cn("flex items-center gap-1.5 text-sm font-bold", error ? "text-danger" : "text-muted")} role={error ? "alert" : undefined}>
          {error && <CircleAlert className="size-4" aria-hidden />}
          {error ?? (selected.length === 0 ? "Pick one or more." : `${selected.length} picked`)}
        </p>
        <Button size="lg" onClick={save} loading={pending} disabled={state.status === "loading"}>
          {pending ? "Saving…" : isFirstTime ? "Build my feed" : "Save picks"}
          {!pending && <ArrowRight className="size-5" aria-hidden />}
        </Button>
      </div>
    </div>
  );
}
