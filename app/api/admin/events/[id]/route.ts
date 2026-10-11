import { NextResponse, type NextRequest } from "next/server";
import { apiError, readJson, validationError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { toEventDTO } from "@/lib/events/serialize";
import { prisma } from "@/lib/prisma";
import { firstFieldErrors } from "@/lib/validation/errors";
import {
  eventUpdateSchema,
  FUTURE_DATE_MESSAGE,
  isFutureDate,
} from "@/lib/validation/event";

const notFound = () => apiError(404, "NOT_FOUND", "That event doesn't exist.");

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/events/[id]">,
) {
  const result = await requireAdmin(request);
  if (!result.ok) return result.response;

  const { id } = await ctx.params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return notFound();

  return NextResponse.json({ event: toEventDTO(event) });
}

// Partial update: edit any field or just flip isActive. Events are never deleted.
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/events/[id]">,
) {
  const result = await requireAdmin(request);
  if (!result.ok) return result.response;

  const parsed = eventUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(firstFieldErrors(parsed.error));
  if (Object.keys(parsed.data).length === 0) {
    return apiError(
      400,
      "NOTHING_TO_UPDATE",
      "Send at least one field to update.",
    );
  }

  const { id } = await ctx.params;
  const existing = await prisma.event.findUnique({
    where: { id },
    select: { startsAt: true },
  });
  if (!existing) return notFound();

  const { startsAt, ...changes } = parsed.data;
  const dateChanged =
    startsAt !== undefined &&
    new Date(startsAt).getTime() !== existing.startsAt.getTime();
  if (dateChanged && !isFutureDate(startsAt)) {
    return validationError({ startsAt: FUTURE_DATE_MESSAGE });
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...changes,
      ...(startsAt !== undefined && { startsAt: new Date(startsAt) }),
    },
  });

  return NextResponse.json({ event: toEventDTO(event) });
}
