import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";
import { readAuth } from "@/lib/auth/session";
import { getVisitorEvent } from "@/lib/events/queries";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/events/[id]">) {
  const { id } = await ctx.params;
  const auth = await readAuth(request);
  const event = await getVisitorEvent(id, auth?.userId);
  if (!event) return apiError(404, "NOT_FOUND", "That event doesn't exist or is no longer listed.");

  return NextResponse.json({ event, authenticated: Boolean(auth) });
}
