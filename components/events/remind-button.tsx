"use client";

import { Bell, BellRing } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { cn } from "@/lib/cn";

type RemindButtonProps = {
  eventId: string;
  eventTitle: string;
  initialReminded: boolean;
  authenticated: boolean;
  size?: "sm" | "md";
  className?: string;
};

// The button flips the moment it's tapped (useOptimistic). If saving fails, React drops
// the optimistic value at the end of the transition, so it snaps back and we show why.
export function RemindButton({
  eventId,
  eventTitle,
  initialReminded,
  authenticated,
  size = "sm",
  className,
}: RemindButtonProps) {
  const router = useRouter();
  const [reminded, setReminded] = useState(initialReminded);
  const [optimisticReminded, setOptimisticReminded] = useOptimistic(reminded);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (!authenticated) {
      const here = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    if (isPending) return;

    const next = !optimisticReminded;
    startTransition(async () => {
      setOptimisticReminded(next);
      try {
        await apiFetch(`/api/events/${eventId}/reminder`, { method: next ? "PUT" : "DELETE" });
        startTransition(() => setReminded(next));
      } catch (error) {
        toast.error(next ? "Couldn't set your reminder" : "Couldn't remove your reminder", {
          description: error instanceof ApiClientError ? error.message : eventTitle,
        });
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={optimisticReminded}
      aria-busy={isPending || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink font-bold whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        size === "sm" ? "h-10 px-3.5 text-sm" : "h-12 px-5 text-base",
        optimisticReminded
          ? "bg-ink text-lime shadow-pop-pink hover:shadow-[6px_6px_0_var(--color-pink)]"
          : "bg-white text-ink shadow-pop hover:shadow-pop-lg",
        className,
      )}
    >
      {optimisticReminded ? (
        <BellRing className="size-4 animate-[ring_0.5s_ease-in-out]" aria-hidden />
      ) : (
        <Bell className="size-4" aria-hidden />
      )}
      {optimisticReminded ? "Reminder set" : "Remind me"}
      <span className="sr-only">: {eventTitle}</span>
    </button>
  );
}
