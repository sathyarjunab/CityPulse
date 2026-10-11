import { NextResponse, type NextRequest } from "next/server";
import { unauthorized, validationError } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { listUpcomingEvents } from "@/lib/events/queries";
import { prisma } from "@/lib/prisma";
import { firstFieldErrors } from "@/lib/validation/errors";
import { feedQuerySchema } from "@/lib/validation/visitor";

// Upcoming events from the user's favourite categories.
export async function GET(request: NextRequest) {
  const result = await requireUser(request);
  if (!result.ok) return result.response;

  const parsed = feedQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return validationError(firstFieldErrors(parsed.error));

  const user = await prisma.user.findUnique({
    where: { id: result.auth.userId },
    select: { favoriteCategories: true },
  });
  if (!user) return unauthorized();

  const { favoriteCategories } = user;
  const page =
    favoriteCategories.length > 0
      ? await listUpcomingEvents({ ...parsed.data, category: favoriteCategories, userId: result.auth.userId })
      : { events: [], page: 1, pageSize: parsed.data.pageSize, total: 0, totalPages: 0 };

  return NextResponse.json({ ...page, favoriteCategories, authenticated: true });
}
