import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type SwitchProps = Omit<ComponentProps<"button">, "onChange"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function Switch({ checked, onCheckedChange, className, disabled, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 border-ink shadow-pop-sm transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-lime" : "bg-ink/15",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 left-0.5 size-6 -translate-y-1/2 rounded-full border-2 border-ink bg-white transition-transform duration-200 ease-out",
          checked && "translate-x-6",
        )}
      />
    </button>
  );
}
