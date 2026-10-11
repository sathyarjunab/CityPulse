import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

// PUT sets a reminder, DELETE removes it. Both are idempotent.
export async function PUT(request: NextRequest, ctx: RouteContext<"/api/events/[id]/reminder">) {
  const result = await requireUser(request);
  if (!result.ok) return result.response;

  const { id: eventId } = await ctx.params;
  const event = await prisma.event.findFirst({ where: { id: eventId, isActive: true }, select: { id: true } });
  if (!event) return apiError(404, "NOT_FOUND", "That event doesn't exist or is no longer listed.");

  const { userId } = result.auth;
  await prisma.reminder.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: { userId, eventId },
    update: {},
  });

  return NextResponse.json({ reminded: true });
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/events/[id]/reminder">) {
  const result = await requireUser(request);
  if (!result.ok) return result.response;

  const { id: eventId } = await ctx.params;
  await prisma.reminder.deleteMany({ where: { userId: result.auth.userId, eventId } });

  return NextResponse.json({ reminded: false });
}
