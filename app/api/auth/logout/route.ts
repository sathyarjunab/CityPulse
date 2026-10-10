import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/session";

export async function POST() {
  const response = new NextResponse(null, { status: 204 });
  clearAuthCookie(response);
  return response;
}
