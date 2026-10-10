import type { Role } from "@/app/generated/prisma/enums";

export const ADMIN_HOME = "/admin";
export const VISITOR_HOME = "/events";

// Only same-site paths are allowed, and visitors can't be sent into the admin area.
export function landingPathFor(role: Role, next?: string | null) {
  if (role === "ADMIN") return ADMIN_HOME;
  const isSafe = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith(ADMIN_HOME);
  return isSafe ? next : VISITOR_HOME;
}
