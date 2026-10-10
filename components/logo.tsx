import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight", className)}
    >
      <span className="relative grid size-7 place-items-center rounded-full border-2 border-ink bg-pink" aria-hidden>
        <span className="size-3 rounded-full border-2 border-ink bg-lime" />
      </span>
      CityPulse
    </Link>
  );
}
