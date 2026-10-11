import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type TextareaProps = ComponentProps<"textarea"> & { invalid?: boolean };

export function Textarea({ invalid = false, className, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-32 w-full resize-y rounded-xl border-2 bg-white px-4 py-3 text-base text-ink transition-shadow duration-150 outline-none placeholder:text-muted/70",
        invalid ? "border-danger shadow-pop-danger" : "border-ink focus:shadow-pop-violet",
        className,
      )}
      {...props}
    />
  );
}
