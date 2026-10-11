"use client";

import { CalendarDays, Check, CircleAlert, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { Category } from "@/app/generated/prisma/enums";
import { CategoryBadge } from "@/components/category-badge";
import { EventImage } from "@/components/event-image";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/cn";
import type { EventDTO } from "@/lib/events/types";
import { formatEventDate, formatPrice } from "@/lib/format";
import { firstFieldErrors } from "@/lib/validation/errors";
import {
  eventEditFormSchema,
  eventInputSchema,
  type EventInput,
} from "@/lib/validation/event";

type FormValues = {
  title: string;
  category: Category | "";
  city: string;
  startsAt: string;
  price: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
};

type FieldName = keyof Omit<FormValues, "isActive">;
type FieldErrors = Partial<Record<FieldName, string>>;

const FIELD_ORDER: FieldName[] = [
  "title",
  "category",
  "city",
  "startsAt",
  "price",
  "imageUrl",
  "description",
];

const EMPTY: FormValues = {
  title: "",
  category: "",
  city: "",
  startsAt: "",
  price: "",
  description: "",
  imageUrl: "",
  isActive: true,
};

// datetime-local values have no time zone; the browser reads them in the admin's local time.
function toIsoDate(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toLocalInput(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function valuesFrom(event: EventDTO): FormValues {
  return {
    title: event.title,
    category: event.category,
    city: event.city,
    startsAt: toLocalInput(event.startsAt),
    price: String(event.price),
    description: event.description,
    imageUrl: event.imageUrl,
    isActive: event.isActive,
  };
}

function toPayload(
  values: FormValues,
  original?: EventDTO,
): Partial<EventInput> {
  const dateUnchanged =
    original !== undefined &&
    values.startsAt === toLocalInput(original.startsAt);
  return {
    title: values.title,
    category: values.category || undefined,
    city: values.city,
    startsAt: dateUnchanged ? original.startsAt : toIsoDate(values.startsAt),
    price: values.price === "" ? undefined : Number(values.price),
    description: values.description,
    imageUrl: values.imageUrl.trim(),
    isActive: values.isActive,
  };
}

// Without `event` the form adds a new event; with it, the form edits that event.
export function EventForm({ event: original }: { event?: EventDTO }) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() =>
    original ? valuesFrom(original) : EMPTY,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // An edited event may keep its original (possibly past) date; only a new date must be in the future.
  const keepsOriginalDate =
    original !== undefined &&
    values.startsAt === toLocalInput(original.startsAt);
  const schema = keepsOriginalDate ? eventEditFormSchema : eventInputSchema;

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  function validateField(field: FieldName) {
    if (values[field] === "") return;
    const result = schema.shape[field].safeParse(
      toPayload(values, original)[field],
    );
    setErrors((current) => ({
      ...current,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  }

  function showErrors(fieldErrors: FieldErrors) {
    setErrors(fieldErrors);
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (first)
      document
        .getElementById(first === "category" ? "category-MUSIC" : first)
        ?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse(toPayload(values, original));
    if (!parsed.success) {
      showErrors(firstFieldErrors(parsed.error));
      return;
    }

    setPending(true);
    setFormError(null);
    try {
      const { event: saved } = await apiFetch<{ event: EventDTO }>(
        original ? `/api/admin/events/${original.id}` : "/api/admin/events",
        {
          method: original ? "PATCH" : "POST",
          body: JSON.stringify(parsed.data),
        },
      );
      const message = original
        ? "Changes saved"
        : saved.isActive
          ? "Event added and live"
          : "Event added as inactive";
      toast.success(message, { description: saved.title });
      // Next keeps visited pages mounted (hidden), so reset for the next visit.
      setValues(original ? valuesFrom(saved) : EMPTY);
      setErrors({});
      setPending(false);
      router.push("/admin");
    } catch (error) {
      if (error instanceof ApiClientError && error.fields)
        showErrors(error.fields);
      else
        setFormError(
          error instanceof ApiClientError
            ? error.message
            : "Couldn't save the event. Try again.",
        );
      setPending(false);
    }
  }

  const preview = toPayload(values, original);
  const previewPrice =
    preview.price !== undefined && Number.isInteger(preview.price)
      ? formatPrice(preview.price)
      : null;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      <div className="card-pop grid gap-6 p-5 sm:p-8">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border-2 border-ink bg-danger/10 px-4 py-3 text-sm font-bold shadow-pop-danger"
          >
            <CircleAlert
              className="mt-0.5 size-4 shrink-0 text-danger"
              aria-hidden
            />
            {formError}
          </div>
        )}

        <Field id="title" label="Title" error={errors.title}>
          <Input
            id="title"
            placeholder="Sunset Jazz on the Terrace"
            value={values.title}
            maxLength={120}
            onChange={(event) => update("title", event.target.value)}
            onBlur={() => validateField("title")}
            invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
          />
        </Field>

        <fieldset
          className="grid gap-2"
          aria-describedby={errors.category ? "category-error" : undefined}
        >
          <legend className="mb-1.5 text-sm font-bold">Category</legend>
          <div
            role="radiogroup"
            aria-label="Category"
            className="flex flex-wrap gap-2.5"
          >
            {CATEGORIES.map((category) => {
              const selected = values.category === category.value;
              return (
                <button
                  key={category.value}
                  id={`category-${category.value}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update("category", category.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-4 py-2 text-sm font-bold transition-[transform,box-shadow,background-color] duration-150",
                    selected
                      ? `${category.className} -translate-x-0.5 -translate-y-0.5 shadow-pop-sm`
                      : "bg-white hover:bg-paper",
                  )}
                >
                  <span aria-hidden>{category.emoji}</span>
                  {category.label}
                </button>
              );
            })}
          </div>
          {errors.category && (
            <p
              id="category-error"
              role="alert"
              className="flex items-center gap-1.5 text-[13px] font-bold text-danger"
            >
              <CircleAlert className="size-3.5 shrink-0" aria-hidden />
              {errors.category}
            </p>
          )}
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="city" label="City" error={errors.city}>
            <Input
              id="city"
              placeholder="Coimbatore"
              autoComplete="address-level2"
              value={values.city}
              maxLength={60}
              onChange={(event) => update("city", event.target.value)}
              onBlur={() => validateField("city")}
              invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? "city-error" : undefined}
            />
          </Field>

          <Field id="startsAt" label="Date and time" error={errors.startsAt}>
            <Input
              id="startsAt"
              type="datetime-local"
              value={values.startsAt}
              onChange={(event) => update("startsAt", event.target.value)}
              onBlur={() => validateField("startsAt")}
              invalid={Boolean(errors.startsAt)}
              aria-describedby={errors.startsAt ? "startsAt-error" : undefined}
            />
          </Field>
        </div>

        <Field
          id="price"
          label="Price"
          error={errors.price}
          hint={
            previewPrice
              ? `Visitors will see ${previewPrice}`
              : "Whole rupees. Use 0 for a free event."
          }
        >
          <div className="relative">
            <span
              className="pointer-events-none absolute inset-y-0 left-4 grid place-items-center font-bold text-muted"
              aria-hidden
            >
              ₹
            </span>
            <Input
              id="price"
              inputMode="numeric"
              placeholder="799"
              value={values.price}
              onChange={(event) =>
                update(
                  "price",
                  event.target.value.replace(/\D/g, "").slice(0, 9),
                )
              }
              onBlur={() => validateField("price")}
              invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? "price-error" : "price-hint"}
              className="pl-9"
            />
          </div>
        </Field>

        <Field
          id="imageUrl"
          label="Image URL"
          error={errors.imageUrl}
          hint="A direct link to a JPG, PNG or WebP image."
        >
          <Input
            id="imageUrl"
            type="url"
            inputMode="url"
            placeholder="https://images.unsplash.com/photo-…"
            value={values.imageUrl}
            onChange={(event) => update("imageUrl", event.target.value)}
            onBlur={() => validateField("imageUrl")}
            invalid={Boolean(errors.imageUrl)}
            aria-describedby={
              errors.imageUrl ? "imageUrl-error" : "imageUrl-hint"
            }
          />
        </Field>

        <Field
          id="description"
          label="Description"
          error={errors.description}
          hint={`${values.description.trim().length} / 2,000 characters`}
        >
          <Textarea
            id="description"
            placeholder="What's happening, who it's for and what to bring."
            value={values.description}
            maxLength={2000}
            onChange={(event) => update("description", event.target.value)}
            onBlur={() => validateField("description")}
            invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "description-error" : "description-hint"
            }
          />
        </Field>

        <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-dashed border-ink/25 p-4">
          <div className="grid gap-0.5">
            <span id="isActive-label" className="text-sm font-bold">
              Active
            </span>
            <span className="text-[13px] text-muted">
              {values.isActive
                ? "Visitors can see this event."
                : "Hidden until you switch it on."}
            </span>
          </div>
          <Switch
            checked={values.isActive}
            onCheckedChange={(checked) => update("isActive", checked)}
            aria-labelledby="isActive-label"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/admin" className={buttonClasses({ variant: "ghost" })}>
            Cancel
          </Link>
          <Button type="submit" loading={pending}>
            {!pending &&
              (original ? (
                <Check className="size-5" aria-hidden />
              ) : (
                <Plus className="size-5" aria-hidden />
              ))}
            {pending ? "Saving…" : original ? "Save changes" : "Add event"}
          </Button>
        </div>
      </div>

      <aside className="grid gap-3 lg:sticky lg:top-28" aria-label="Preview">
        <p className="text-xs font-bold tracking-widest text-muted uppercase">
          Preview
        </p>
        <div
          className={cn(
            "card-pop overflow-hidden",
            !values.isActive && "opacity-70",
          )}
        >
          {preview.imageUrl ? (
            <EventImage
              src={preview.imageUrl}
              alt=""
              sizes="340px"
              className="aspect-video border-b-2 border-ink"
            />
          ) : (
            <div
              className="grid aspect-video place-items-center border-b-2 border-ink bg-paper text-4xl"
              aria-hidden
            >
              🖼️
            </div>
          )}
          <div className="grid gap-2 p-4">
            {values.category ? (
              <CategoryBadge
                category={values.category}
                className="justify-self-start"
              />
            ) : (
              <span className="h-5 w-20 rounded-full bg-ink/10" aria-hidden />
            )}
            <h2 className="text-xl font-extrabold break-words">
              {values.title.trim() || "Your event title"}
            </h2>
            <p className="grid gap-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden />
                {preview.startsAt
                  ? formatEventDate(preview.startsAt)
                  : "Date and time"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {values.city.trim() || "City"}
              </span>
            </p>
            <p className="font-display text-2xl font-extrabold">
              {previewPrice ?? "₹—"}
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
