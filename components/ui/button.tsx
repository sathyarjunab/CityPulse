import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "dark" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl border-2 font-bold whitespace-nowrap transition-[transform,box-shadow,background-color] duration-150 select-none disabled:cursor-not-allowed disabled:opacity-60";

const pop =
  "border-ink shadow-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pop-lg active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:translate-0 disabled:shadow-pop";

const variants: Record<Variant, string> = {
  primary: `${pop} bg-lime text-ink`,
  dark: `${pop} bg-ink text-paper shadow-pop-pink hover:shadow-[6px_6px_0_var(--color-pink)] disabled:shadow-pop-pink`,
  secondary: `${pop} bg-white text-ink`,
  ghost: "border-transparent bg-transparent text-ink hover:border-ink hover:bg-white",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-6 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
