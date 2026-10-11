import { z } from "zod";
import { Category } from "@/app/generated/prisma/enums";

export const DEFAULT_PAGE_SIZE = 9;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

const page = z.coerce.number({ error: "page must be a number." }).int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(24).default(DEFAULT_PAGE_SIZE);

export const eventListQuerySchema = z.object({
  category: z.enum(Category, { error: "Unknown category." }).optional(),
  city: optionalText(60),
  q: optionalText(100),
  page,
  pageSize,
});

export type EventListQuery = z.infer<typeof eventListQuerySchema>;

export const feedQuerySchema = z.object({ page, pageSize });

export const favoritesSchema = z.object({
  categories: z
    .array(z.enum(Category, { error: "Unknown category." }), { error: "Pick at least one category." })
    .min(1, { error: "Pick at least one category." })
    .transform((categories) => [...new Set(categories)]),
});
