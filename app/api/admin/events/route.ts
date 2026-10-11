import { NextResponse, type NextRequest } from "next/server";
import { readJson, validationError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { toEventDTO } from "@/lib/events/serialize";
import { prisma } from "@/lib/prisma";
import { firstFieldErrors } from "@/lib/validation/errors";
import { eventInputSchema } from "@/lib/validation/event";

// All events, active or not: upcoming soonest first, then past ones most recent first.
export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (!result.ok) return result.response;

  const now = new Date();
  const [upcoming, past] = await Promise.all([
    prisma.event.findMany({ where: { startsAt: { gte: now } }, orderBy: { startsAt: "asc" } }),
    prisma.event.findMany({ where: { startsAt: { lt: now } }, orderBy: { startsAt: "desc" } }),
  ]);

  return NextResponse.json({ events: [...upcoming, ...past].map(toEventDTO) });
}

export async function POST(request: NextRequest) {
  const result = await requireAdmin(request);
  if (!result.ok) return result.response;

  const parsed = eventInputSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(firstFieldErrors(parsed.error));

  const event = await prisma.event.create({
    data: { ...parsed.data, startsAt: new Date(parsed.data.startsAt) },
  });

  return NextResponse.json({ event: toEventDTO(event) }, { status: 201 });
}
