import { NextResponse, type NextRequest } from "next/server";
import { readJson, unauthorized, validationError } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { firstFieldErrors } from "@/lib/validation/errors";
import { favoritesSchema } from "@/lib/validation/visitor";

export async function GET(request: NextRequest) {
  const result = await requireUser(request);
  if (!result.ok) return result.response;

  const user = await prisma.user.findUnique({
    where: { id: result.auth.userId },
    select: { favoriteCategories: true },
  });
  if (!user) return unauthorized();

  return NextResponse.json({ favoriteCategories: user.favoriteCategories });
}

// Replaces the user's favourite categories (at least one).
export async function PUT(request: NextRequest) {
  const result = await requireUser(request);
  if (!result.ok) return result.response;

  const parsed = favoritesSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(firstFieldErrors(parsed.error));

  const user = await prisma.user.update({
    where: { id: result.auth.userId },
    data: { favoriteCategories: parsed.data.categories },
    select: { favoriteCategories: true },
  });

  return NextResponse.json({ favoriteCategories: user.favoriteCategories });
}
