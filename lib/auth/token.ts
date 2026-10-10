import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/app/generated/prisma/enums";

export type TokenPayload = { userId: string; role: Role };

export const AUTH_COOKIE = "cp_token";
export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export function signToken({ userId, role }: TokenPayload) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyToken(
  token: string | undefined,
): Promise<TokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string") return null;
    if (payload.role !== "USER" && payload.role !== "ADMIN") return null;
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}
