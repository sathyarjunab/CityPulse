import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";
import type { User } from "@/app/generated/prisma/client";
import { forbidden, unauthorized } from "@/lib/api/response";
import { AUTH_COOKIE, TOKEN_TTL_SECONDS, verifyToken, type TokenPayload } from "./token";

export type PublicUser = Pick<User, "id" | "email" | "role" | "favoriteCategories">;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    favoriteCategories: user.favoriteCategories,
  };
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// API clients (e.g. a mobile app) send `Authorization: Bearer <token>`; the web app relies on the cookie.
export function readAuth(request: NextRequest): Promise<TokenPayload | null> {
  const header = request.headers.get("authorization");
  const bearer = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : undefined;
  return verifyToken(bearer || request.cookies.get(AUTH_COOKIE)?.value);
}

type AuthResult =
  | { ok: true; auth: TokenPayload }
  | { ok: false; response: NextResponse };

export async function requireUser(request: NextRequest): Promise<AuthResult> {
  const auth = await readAuth(request);
  return auth ? { ok: true, auth } : { ok: false, response: unauthorized() };
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const auth = await readAuth(request);
  if (!auth) return { ok: false, response: unauthorized() };
  if (auth.role !== "ADMIN") return { ok: false, response: forbidden() };
  return { ok: true, auth };
}

// For Server Components. Reads cookies, so callers must render inside <Suspense>.
export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(AUTH_COOKIE)?.value);
}

export async function requireAdminSession(next = "/admin"): Promise<TokenPayload> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (session.role !== "ADMIN") redirect("/events");
  return session;
}
