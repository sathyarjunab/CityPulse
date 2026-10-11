import "server-only";
import type { Prisma } from "@/app/generated/prisma/client";
import type { Category } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { toVisitorEventDTO } from "./serialize";
import type { EventPageDTO, VisitorEventDTO } from "./types";

type ListOptions = {
  category?: Category | Category[];
  city?: string;
  q?: string;
  page: number;
  pageSize: number;
  userId?: string;
};

async function remindedEventIds(userId: string | undefined, eventIds: string[]) {
  if (!userId || eventIds.length === 0) return new Set<string>();
  const reminders = await prisma.reminder.findMany({
    where: { userId, eventId: { in: eventIds } },
    select: { eventId: true },
  });
  return new Set(reminders.map((reminder) => reminder.eventId));
}

// Visitors only ever see active events that haven't started yet, soonest first.
export async function listUpcomingEvents({
  category,
  city,
  q,
  page,
  pageSize,
  userId,
}: ListOptions): Promise<Omit<EventPageDTO, "authenticated">> {
  const where: Prisma.EventWhereInput = {
    isActive: true,
    startsAt: { gte: new Date() },
    ...(category && { category: Array.isArray(category) ? { in: category } : category }),
    ...(city && { city: { equals: city, mode: "insensitive" } }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [total, events] = await prisma.$transaction([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const reminded = await remindedEventIds(
    userId,
    events.map((event) => event.id),
  );

  return {
    events: events.map((event) => toVisitorEventDTO(event, reminded.has(event.id))),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

// A single event page. Inactive events are hidden from visitors; past ones stay viewable.
export async function getVisitorEvent(id: string, userId?: string): Promise<VisitorEventDTO | null> {
  const event = await prisma.event.findFirst({ where: { id, isActive: true } });
  if (!event) return null;
  const reminded = await remindedEventIds(userId, [event.id]);
  return toVisitorEventDTO(event, reminded.has(event.id));
}

export async function listUpcomingCities(): Promise<string[]> {
  const rows = await prisma.event.findMany({
    where: { isActive: true, startsAt: { gte: new Date() } },
    distinct: ["city"],
    select: { city: true },
    orderBy: { city: "asc" },
  });
  return rows.map((row) => row.city);
}
