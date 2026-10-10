import { NextResponse, type NextRequest } from "next/server";
import { landingPathFor, VISITOR_HOME } from "@/lib/auth/redirect";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth/token";

// Optimistic redirects only. Admin pages and APIs re-check the session on the server.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const auth = await verifyToken(request.cookies.get(AUTH_COOKIE)?.value);

  if (pathname.startsWith("/admin")) {
    if (!auth) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname + search);
      return NextResponse.redirect(login);
    }
    if (auth.role !== "ADMIN") {
      return NextResponse.redirect(new URL(VISITOR_HOME, request.url));
    }
  }

  if (auth && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(
      new URL(landingPathFor(auth.role), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/signup"],
};
