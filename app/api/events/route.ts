import { NextResponse, type NextRequest } from "next/server";
import { validationError } from "@/lib/api/response";
import { readAuth } from "@/lib/auth/session";
import { listUpcomingEvents } from "@/lib/events/queries";
import { firstFieldErrors } from "@/lib/validation/errors";
import { eventListQuerySchema } from "@/lib/validation/visitor";

// Public. Filters combine: ?category=MUSIC&city=Coimbatore&q=night&page=1
export async function GET(request: NextRequest) {
  const parsed = eventListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return validationError(firstFieldErrors(parsed.error));

  const auth = await readAuth(request);
  const result = await listUpcomingEvents({ ...parsed.data, userId: auth?.userId });

  return NextResponse.json({ ...result, authenticated: Boolean(auth) });
}
