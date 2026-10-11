import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { apiError, readJson, validationError } from "@/lib/api/response";
import { setAuthCookie, toPublicUser } from "@/lib/auth/session";
import { signToken } from "@/lib/auth/token";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation/auth";
import { firstFieldErrors } from "@/lib/validation/errors";

const emailTaken = () =>
  apiError(409, "EMAIL_TAKEN", "That email is already registered.", {
    email: "That email is already registered. Log in instead.",
  });

export async function POST(request: NextRequest) {
  const parsed = signupSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return validationError(firstFieldErrors(parsed.error));
  }

  const { email, password } = parsed.data;
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return emailTaken();
  }

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 10) },
    });
    const token = await signToken({ userId: user.id, role: user.role });
    const response = NextResponse.json({ token, user: toPublicUser(user) }, { status: 201 });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return emailTaken();
    }
    throw error;
  }
}
