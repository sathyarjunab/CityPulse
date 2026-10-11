import type { Category } from "@/app/generated/prisma/enums";

type CategoryMeta = {
  value: Category;
  label: string;
  emoji: string;
  className: string;
};

export const CATEGORIES: readonly CategoryMeta[] = [
  { value: "MUSIC", label: "Music", emoji: "🎸", className: "bg-violet text-white" },
  { value: "WORKSHOP", label: "Workshop", emoji: "🛠️", className: "bg-sky text-ink" },
  { value: "FOOD", label: "Food", emoji: "🍜", className: "bg-orange text-ink" },
  { value: "SPORTS", label: "Sports", emoji: "⚽", className: "bg-lime text-ink" },
  { value: "KIDS", label: "Kids", emoji: "🧸", className: "bg-pink text-ink" },
];

export const CATEGORY_META = Object.fromEntries(
  CATEGORIES.map((category) => [category.value, category]),
) as Record<Category, CategoryMeta>;
