import { z } from "zod";
import { Category } from "@/app/generated/prisma/enums";

export const MAX_PRICE = 10_00_00_000;

// "new delhi" -> "New Delhi", so the same city never shows up twice in filters.
function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export const FUTURE_DATE_MESSAGE = "Pick a date and time in the future.";

export function isFutureDate(value: string) {
  return new Date(value).getTime() > Date.now();
}

export const startsAtSchema = z.iso.datetime({ offset: true, error: "Pick a date and time." });

const eventFields = {
  title: z
    .string({ error: "Give the event a title." })
    .trim()
    .min(1, { error: "Give the event a title." })
    .min(3, { error: "Use at least 3 characters." })
    .max(120, { error: "Keep it under 120 characters." }),
  category: z.enum(Category, { error: "Pick a category." }),
  city: z
    .string({ error: "Enter a city." })
    .trim()
    .min(2, { error: "Enter a city." })
    .max(60, { error: "Keep it under 60 characters." })
    .transform(toTitleCase),
  startsAt: startsAtSchema,
  price: z
    .number({ error: "Enter a price (0 for a free event)." })
    .int({ error: "Use whole rupees only." })
    .min(0, { error: "Price can't be negative." })
    .max(MAX_PRICE, { error: "That's over ₹10,00,00,000." }),
  description: z
    .string({ error: "Add a short description." })
    .trim()
    .min(1, { error: "Add a short description." })
    .min(10, { error: "Use at least 10 characters." })
    .max(2000, { error: "Keep it under 2,000 characters." }),
  imageUrl: z.url({
    protocol: /^https?$/,
    hostname: z.regexes.domain,
    error: "Enter a full image link starting with https://",
  }),
  isActive: z.boolean({ error: "isActive must be true or false." }),
};

// New events must start in the future.
export const eventInputSchema = z.object({
  ...eventFields,
  startsAt: startsAtSchema.refine(isFutureDate, { error: FUTURE_DATE_MESSAGE }),
  isActive: eventFields.isActive.default(true),
});

// Edits send any subset of fields. A past date is only rejected when it's being changed
// (checked against the stored value in the API), so past events can still be corrected.
export const eventUpdateSchema = z.object(eventFields).partial();

// Full edit-form payload: every field required, date not forced into the future.
export const eventEditFormSchema = z.object(eventFields);

export type EventInput = z.input<typeof eventInputSchema>;
