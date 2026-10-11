import type { Role } from "@/app/generated/prisma/enums";

export const ADMIN_HOME = "/admin";
export const VISITOR_HOME = "/events";
export const FAVORITES_PATH = "/favorites";
export const FEED_PATH = "/feed";

// Only same-site paths are allowed, and visitors can't be sent into the admin area.
export function safeNextPath(next?: string | null) {
  const isSafe = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith(ADMIN_HOME);
  return isSafe ? next : undefined;
}

// Visitors who haven't picked favourite categories yet are asked to do that first.
export function landingPathFor(role: Role, next?: string | null, hasFavorites = true) {
  if (role === "ADMIN") return ADMIN_HOME;
  const target = safeNextPath(next) ?? (hasFavorites ? VISITOR_HOME : FEED_PATH);
  if (!hasFavorites && !target.startsWith(FAVORITES_PATH)) {
    return `${FAVORITES_PATH}?next=${encodeURIComponent(target)}`;
  }
  return target;
}
