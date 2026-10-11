import { NextResponse, type NextRequest } from "next/server";
import { landingPathFor, VISITOR_HOME } from "@/lib/auth/redirect";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth/token";

const MEMBER_PATHS = ["/feed", "/favorites"];

// Optimistic redirects only. Pages and APIs re-check the session on the server.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const auth = await verifyToken(request.cookies.get(AUTH_COOKIE)?.value);

  const needsLogin =
    pathname.startsWith("/admin") ||
    MEMBER_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (needsLogin && !auth) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && auth?.role !== "ADMIN") {
    return NextResponse.redirect(new URL(VISITOR_HOME, request.url));
  }

  if (auth && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL(landingPathFor(auth.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/feed/:path*", "/favorites/:path*", "/login", "/signup"],
};
