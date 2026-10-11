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
