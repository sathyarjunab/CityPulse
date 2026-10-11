import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { apiError, readJson, validationError } from "@/lib/api/response";
import { setAuthCookie, toPublicUser } from "@/lib/auth/session";
import { signToken } from "@/lib/auth/token";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { firstFieldErrors } from "@/lib/validation/errors";

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return validationError(firstFieldErrors(parsed.error));
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return apiError(401, "INVALID_CREDENTIALS", "Wrong email or password.");
  }

  const token = await signToken({ userId: user.id, role: user.role });
  const response = NextResponse.json({ token, user: toPublicUser(user) });
  setAuthCookie(request, response, token);
  return response;
}
