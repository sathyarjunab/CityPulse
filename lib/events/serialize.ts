import type { Event } from "@/app/generated/prisma/client";
import type { EventDTO } from "./types";

export function toEventDTO(event: Event): EventDTO {
  return {
    id: event.id,
    title: event.title,
    category: event.category,
    city: event.city,
    startsAt: event.startsAt.toISOString(),
    price: event.price,
    description: event.description,
    imageUrl: event.imageUrl,
    isActive: event.isActive,
  };
}
