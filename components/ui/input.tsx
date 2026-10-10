import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type InputProps = ComponentProps<"input"> & { invalid?: boolean };

export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "h-12 w-full rounded-xl border-2 bg-white px-4 text-base text-ink transition-shadow duration-150 outline-none placeholder:text-muted/70",
        invalid
          ? "border-danger shadow-pop-danger"
          : "border-ink focus:shadow-pop-violet",
        className,
      )}
      {...props}
    />
  );
}
