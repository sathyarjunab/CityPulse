"use client";

import {
  Check,
  CircleAlert,
  CloudCheck,
  LoaderCircle,
  LogIn,
  RotateCw,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CardTheme, Sticker } from "@/app/generated/prisma/enums";
import { CategoryBadge } from "@/components/category-badge";
import { ErrorState } from "@/components/events/event-grid";
import { buttonClasses } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import {
  CARD_THEME_META,
  CARD_THEMES,
  DEFAULT_DESIGN,
  MAX_STICKERS,
  STICKER_META,
  STICKERS,
  type CardDesignDTO,
} from "@/lib/card";
import { cn } from "@/lib/cn";
import type { VisitorEventDTO } from "@/lib/events/types";
import { formatEventDate, formatPrice } from "@/lib/format";

type PlacedSticker = { key: number; sticker: Sticker; leaving: boolean };

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };

type SaveStatus = "idle" | "saving" | "saved" | "error";

const REMOVE_ANIMATION_MS = 200;

// Fixed spots on the right-hand side of the card, clear of the text. Stickers glide between them.
const SLOTS = [
  { top: "5%", left: "68%", rotate: "12deg" },
  { top: "31%", left: "77%", rotate: "-12deg" },
  { top: "55%", left: "67%", rotate: "8deg" },
];

export function CardDesigner({
  event,
  authenticated,
}: {
  event: VisitorEventDTO;
  authenticated: boolean;
}) {
  return (
    <section aria-labelledby="designer-heading" className="grid gap-6">
      <div className="grid gap-1.5">
        <h2
          id="designer-heading"
          className="text-3xl font-extrabold sm:text-4xl"
        >
          Design your card <span aria-hidden>🎨</span>
        </h2>
        <p className="max-w-xl text-muted">
          Make this event yours: pick a background and add up to {MAX_STICKERS}{" "}
          stickers. It saves as you go.
        </p>
      </div>
      {authenticated ? (
        <DesignerEditor event={event} />
      ) : (
        <DesignerShell
          preview={
            <EventCardPreview
              event={event}
              theme={DEFAULT_DESIGN.theme}
              stickers={[]}
            />
          }
          controls={
            <div className="grid justify-items-start gap-3">
              <span className="text-4xl" aria-hidden>
                🔒
              </span>
              <h3 className="text-2xl font-extrabold">
                Log in to design your card
              </h3>
              <p className="text-muted">
                Your theme and stickers are saved to your account for this
                event.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(`/events/${event.id}`)}`}
                className={buttonClasses({ className: "mt-1" })}
              >
                <LogIn className="size-5" aria-hidden />
                Log in
              </Link>
            </div>
          }
        />
      )}
    </section>
  );
}

function DesignerEditor({ event }: { event: VisitorEventDTO }) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [theme, setTheme] = useState<CardTheme>(DEFAULT_DESIGN.theme);
  const [placed, setPlaced] = useState<PlacedSticker[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const nextKey = useRef(0);
  const queued = useRef<CardDesignDTO | null>(null);
  const inFlight = useRef(false);
  const lastDesign = useRef<CardDesignDTO>(DEFAULT_DESIGN);

  const url = `/api/events/${event.id}/card`;

  // Re-runs when the page is shown again, so the card reflects what's saved. A save that's
  // still in progress wins over the fetched copy.
  useEffect(() => {
    let ignore = false;
    apiFetch<{ design: CardDesignDTO }>(url)
      .then(({ design }) => {
        if (ignore || inFlight.current || queued.current) return;
        lastDesign.current = design;
        setTheme(design.theme);
        setPlaced(
          design.stickers.map((sticker) => ({
            key: nextKey.current++,
            sticker,
            leaving: false,
          })),
        );
        setLoad({ status: "ready" });
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setLoad({
          status: "error",
          message:
            error instanceof ApiClientError
              ? error.message
              : "Couldn't load your card.",
        });
      });
    return () => {
      ignore = true;
    };
  }, [url, attempt]);

  // Saves run one at a time; changes made meanwhile are coalesced into a single follow-up save,
  // so the latest design always lands last. keepalive lets a save finish even if the page reloads.
  async function flush() {
    if (inFlight.current || !queued.current) return;
    const design = queued.current;
    queued.current = null;
    inFlight.current = true;
    setSaveStatus("saving");
    let failed = false;
    try {
      await apiFetch(url, {
        method: "PUT",
        body: JSON.stringify(design),
        keepalive: true,
      });
    } catch {
      failed = true;
    }
    inFlight.current = false;
    if (queued.current) return flush();
    setSaveStatus(failed ? "error" : "saved");
  }

  function persist(design: CardDesignDTO) {
    lastDesign.current = design;
    queued.current = design;
    void flush();
  }

  const active = placed.filter((item) => !item.leaving);
  const isFull = active.length >= MAX_STICKERS;

  function chooseTheme(value: CardTheme) {
    if (value === theme) return;
    setTheme(value);
    persist({ theme: value, stickers: active.map((item) => item.sticker) });
  }

  function addSticker(sticker: Sticker) {
    if (isFull) return;
    const item = { key: nextKey.current++, sticker, leaving: false };
    setPlaced((current) => [...current, item]);
    persist({
      theme,
      stickers: [...active, item].map((entry) => entry.sticker),
    });
  }

  function removeSticker(key: number) {
    setPlaced((current) =>
      current.map((item) =>
        item.key === key ? { ...item, leaving: true } : item,
      ),
    );
    persist({
      theme,
      stickers: active
        .filter((item) => item.key !== key)
        .map((item) => item.sticker),
    });
    setTimeout(
      () => setPlaced((current) => current.filter((item) => item.key !== key)),
      REMOVE_ANIMATION_MS,
    );
  }

  if (load.status === "error") {
    return (
      <ErrorState
        message={load.message}
        onRetry={() => {
          setLoad({ status: "loading" });
          setAttempt((count) => count + 1);
        }}
      />
    );
  }

  if (load.status === "loading") return <DesignerSkeleton />;

  const counts = active.reduce<Partial<Record<Sticker, number>>>(
    (totals, item) => {
      totals[item.sticker] = (totals[item.sticker] ?? 0) + 1;
      return totals;
    },
    {},
  );

  return (
    <DesignerShell
      preview={
        <EventCardPreview
          event={event}
          theme={theme}
          stickers={placed}
          onRemove={removeSticker}
        />
      }
      controls={
        <div className="grid gap-7">
          <fieldset className="grid gap-3">
            <legend className="mb-3 text-sm font-bold tracking-wider text-muted uppercase">
              Background
            </legend>
            <div
              role="radiogroup"
              aria-label="Background theme"
              className="grid grid-cols-3 gap-3"
            >
              {CARD_THEMES.map((option) => {
                const selected = option.value === theme;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => chooseTheme(option.value)}
                    className="group grid justify-items-center gap-2 rounded-xl text-sm font-bold"
                  >
                    <span
                      className={cn(
                        "relative grid h-16 w-full place-items-center rounded-xl border-2 border-ink transition-[transform,box-shadow] duration-200",
                        option.background,
                        selected
                          ? "-translate-x-0.5 -translate-y-0.5 shadow-pop"
                          : "group-hover:-translate-x-px group-hover:-translate-y-px group-hover:shadow-pop-sm",
                      )}
                    >
                      {selected && (
                        <span className="grid size-7 place-items-center rounded-full border-2 border-ink bg-white text-ink">
                          <Check
                            className="size-4"
                            strokeWidth={3}
                            aria-hidden
                          />
                        </span>
                      )}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="mb-3 flex w-full items-center justify-between text-sm font-bold tracking-wider text-muted uppercase">
              Stickers
            </legend>
            <div className="flex flex-wrap gap-3">
              {STICKERS.map((option) => {
                const count = counts[option.value] ?? 0;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => addSticker(option.value)}
                    disabled={isFull}
                    aria-label={`Add ${option.label} sticker`}
                    className="relative grid size-16 place-items-center rounded-2xl border-2 border-ink bg-white text-3xl shadow-pop-sm transition-[transform,box-shadow,opacity] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-0"
                  >
                    <span aria-hidden>{option.emoji}</span>
                    {count > 0 && (
                      <span className="absolute -top-2 -right-2 grid h-6 min-w-6 place-items-center rounded-full border-2 border-ink bg-lime px-1 text-xs font-extrabold">
                        ×{count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-muted" aria-live="polite">
              <span className="font-bold text-ink">
                {active.length}/{MAX_STICKERS}
              </span>{" "}
              {isFull
                ? "· Card's full. Tap a sticker on the card to remove it."
                : active.length > 0
                  ? "· Tap a sticker on the card to remove it."
                  : "· Tap one to stick it on."}
            </p>
          </fieldset>

          <SaveIndicator
            status={saveStatus}
            onRetry={() => {
              persist(lastDesign.current);
            }}
          />
        </div>
      }
    />
  );
}

function SaveIndicator({
  status,
  onRetry,
}: {
  status: SaveStatus;
  onRetry: () => void;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-colors",
        status === "error"
          ? "border-danger bg-danger/10 text-ink"
          : "border-dashed border-ink/25 text-muted",
      )}
    >
      {status === "idle" && "Changes save automatically."}
      {status === "saving" && (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          Saving…
        </>
      )}
      {status === "saved" && (
        <>
          <CloudCheck className="size-4 text-ink" aria-hidden />
          <span className="text-ink">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <CircleAlert className="size-4 shrink-0 text-danger" aria-hidden />
          <span className="flex-1">Couldn&apos;t save your card.</span>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-2.5 py-1 shadow-pop-sm hover:-translate-x-px hover:-translate-y-px"
          >
            <RotateCw className="size-3.5" aria-hidden />
            Retry
          </button>
        </>
      )}
    </div>
  );
}

function DesignerShell({
  preview,
  controls,
}: {
  preview: ReactNode;
  controls: ReactNode;
}) {
  return (
    <div className="card-pop grid items-center gap-8 bg-paper p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
      <div className="flex justify-center">{preview}</div>
      <div>{controls}</div>
    </div>
  );
}

function EventCardPreview({
  event,
  theme,
  stickers,
  onRemove,
}: {
  event: VisitorEventDTO;
  theme: CardTheme;
  stickers: PlacedSticker[];
  onRemove?: (key: number) => void;
}) {
  const meta = CARD_THEME_META[theme];
  const stuck = stickers.filter((item) => !item.leaving).length;
  let nextSlot = 0;
  const positioned = stickers.map((item, index) => ({
    item,
    position:
      SLOTS[item.leaving ? Math.min(index, SLOTS.length - 1) : nextSlot++] ??
      SLOTS[0],
  }));

  return (
    <div
      className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[1.75rem] border-2 border-ink shadow-pop-lg"
      role="group"
      aria-label={`Card preview: ${meta.label} background, ${stuck} ${stuck === 1 ? "sticker" : "stickers"}`}
    >
      {CARD_THEMES.map((option) => (
        <div
          key={option.value}
          aria-hidden
          className={cn(
            "absolute inset-0 transition-opacity duration-500 ease-out motion-reduce:transition-none",
            option.background,
            option.value === theme ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-[size:18px_18px] opacity-[0.12]"
      />

      <div
        className={cn(
          "relative flex h-full flex-col justify-between p-6 transition-colors duration-500 motion-reduce:transition-none",
          meta.text,
        )}
      >
        <span className="font-display text-sm font-extrabold tracking-widest uppercase">
          CityPulse
        </span>

        <div className="grid max-w-[66%] justify-items-start gap-3">
          <CategoryBadge category={event.category} />
          <h3 className="font-display text-3xl leading-[1.05] font-extrabold break-words sm:text-[2rem]">
            {event.title}
          </h3>
        </div>

        <div className="grid gap-3">
          <div className={cn("grid gap-0.5 text-sm font-bold", meta.muted)}>
            <span>{formatEventDate(event.startsAt)}</span>
            <span>{event.city}</span>
          </div>
          <div className="flex items-end justify-between border-t-2 border-dashed border-current/30 pt-3">
            <span className="font-display text-3xl font-extrabold">
              {formatPrice(event.price)}
            </span>
            <span className="font-display text-xs font-extrabold tracking-widest uppercase opacity-70">
              Admit one
            </span>
          </div>
        </div>
      </div>

      <span
        aria-hidden
        className="absolute top-[72%] -left-4 size-8 rounded-full border-2 border-ink bg-paper"
      />
      <span
        aria-hidden
        className="absolute top-[72%] -right-4 size-8 rounded-full border-2 border-ink bg-paper"
      />

      {positioned.map(({ item, position }) => {
        const label = STICKER_META[item.sticker].label;
        const content = (
          <span
            className={cn(
              "block text-5xl drop-shadow-[3px_3px_0_var(--color-ink)] sm:text-6xl",
              item.leaving ? "animate-sticker-out" : "animate-sticker-in",
            )}
          >
            {STICKER_META[item.sticker].emoji}
          </span>
        );
        return (
          <div
            key={item.key}
            className="absolute transition-[top,left,rotate] duration-300 ease-out motion-reduce:transition-none"
            style={{
              top: position.top,
              left: position.left,
              rotate: position.rotate,
            }}
          >
            {onRemove && !item.leaving ? (
              <button
                type="button"
                onClick={() => onRemove(item.key)}
                aria-label={`Remove ${label} sticker`}
                className="group/sticker relative block rounded-2xl transition-transform hover:scale-110 focus-visible:scale-110"
              >
                {content}
                <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-ink bg-white text-ink opacity-90 shadow-pop-sm transition-opacity group-hover/sticker:opacity-100">
                  <X className="size-3.5" strokeWidth={3} aria-hidden />
                </span>
              </button>
            ) : (
              <span aria-hidden>{content}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DesignerSkeleton() {
  return (
    <DesignerShell
      preview={
        <div className="aspect-[4/5] w-full max-w-sm animate-pulse rounded-[1.75rem] border-2 border-ink/20 bg-ink/10" />
      }
      controls={
        <div
          className="grid animate-pulse gap-7"
          aria-label="Loading your card"
        >
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-16 rounded-xl bg-ink/10" />
            ))}
          </div>
          <div className="flex gap-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="size-16 rounded-2xl bg-ink/10" />
            ))}
          </div>
          <div className="h-11 rounded-xl bg-ink/10" />
        </div>
      }
    />
  );
}
