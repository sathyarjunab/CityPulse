import { NextResponse, type NextRequest } from "next/server";
import { unauthorized } from "@/lib/api/response";
import { requireUser, toPublicUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const result = await requireUser(request);
  if (!result.ok) return result.response;

  const user = await prisma.user.findUnique({ where: { id: result.auth.userId } });
  if (!user) return unauthorized();

  return NextResponse.json({ user: toPublicUser(user) });
}
