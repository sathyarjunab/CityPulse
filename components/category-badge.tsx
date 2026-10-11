import type { Category } from "@/app/generated/prisma/enums";
import { CATEGORY_META } from "@/lib/categories";
import { cn } from "@/lib/cn";

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold",
        meta.className,
        className,
      )}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
