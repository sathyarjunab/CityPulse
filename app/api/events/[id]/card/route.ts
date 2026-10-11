import { NextResponse, type NextRequest } from "next/server";
import { apiError, readJson, validationError } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { DEFAULT_DESIGN, type CardDesignDTO } from "@/lib/card";
import { prisma } from "@/lib/prisma";
import { cardDesignSchema } from "@/lib/validation/card";
import { firstFieldErrors } from "@/lib/validation/errors";

const notFound = () => apiError(404, "NOT_FOUND", "That event doesn't exist or is no longer listed.");

async function isListed(eventId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, isActive: true }, select: { id: true } });
  return Boolean(event);
}

// The signed-in user's card for this event, or the default design if they haven't made one.
export async function GET(request: NextRequest, ctx: RouteContext<"/api/events/[id]/card">) {
  const result = await requireUser(request);
  if (!result.ok) return result.response;

  const { id: eventId } = await ctx.params;
  if (!(await isListed(eventId))) return notFound();

  const saved = await prisma.cardDesign.findUnique({
    where: { userId_eventId: { userId: result.auth.userId, eventId } },
    select: { theme: true, stickers: true },
  });
  const design: CardDesignDTO = saved ?? DEFAULT_DESIGN;

  return NextResponse.json({ design, saved: Boolean(saved) });
}

// Replaces the whole design: one theme and up to three stickers (repeats allowed, order kept).
export async function PUT(request: NextRequest, ctx: RouteContext<"/api/events/[id]/card">) {
  const result = await requireUser(request);
  if (!result.ok) return result.response;

  const parsed = cardDesignSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(firstFieldErrors(parsed.error));

  const { id: eventId } = await ctx.params;
  if (!(await isListed(eventId))) return notFound();

  const { userId } = result.auth;
  const design = await prisma.cardDesign.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: { userId, eventId, ...parsed.data },
    update: parsed.data,
    select: { theme: true, stickers: true },
  });

  return NextResponse.json({ design, saved: true });
}
