import type { Category } from "@/app/generated/prisma/enums";

export type EventDTO = {
  id: string;
  title: string;
  category: Category;
  city: string;
  startsAt: string;
  price: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
};

// What visitors see: no admin-only fields, plus whether they've set a reminder.
export type VisitorEventDTO = Omit<EventDTO, "isActive"> & { remindedByMe: boolean };

export type EventPageDTO = {
  events: VisitorEventDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  authenticated: boolean;
};
