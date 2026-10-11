import { ShieldCheck, Ticket } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Logo } from "@/components/logo";
import { buttonClasses } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="card-pop mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
        <Logo />
        <Suspense fallback={<div className="h-9 w-32 animate-pulse rounded-xl bg-ink/10 sm:w-48" aria-hidden />}>
          <AccountNav />
        </Suspense>
      </div>
    </header>
  );
}

async function AccountNav() {
  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true, role: true } })
    : null;

  const eventsLink = (
    <Link href="/events" className={buttonClasses({ variant: "ghost", size: "sm", className: "max-sm:px-2" })}>
      <Ticket className="size-4" aria-hidden />
      <span className="max-sm:sr-only">Events</span>
    </Link>
  );

  if (!user) {
    return (
      <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
        {eventsLink}
        <Link href="/login" className={buttonClasses({ size: "sm" })}>
          Log in
        </Link>
        <Link href="/signup" className={buttonClasses({ variant: "secondary", size: "sm", className: "max-sm:hidden" })}>
          Sign up
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
      {eventsLink}
      {user.role === "ADMIN" && (
        <Link href="/admin" className={buttonClasses({ variant: "ghost", size: "sm", className: "max-sm:px-2" })}>
          <ShieldCheck className="size-4" aria-hidden />
          <span className="max-sm:sr-only">Admin</span>
        </Link>
      )}
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-pink font-display text-sm font-extrabold uppercase"
        title={user.email}
        aria-label={`Logged in as ${user.email}`}
      >
        {user.email[0]}
      </span>
      <LogoutButton />
    </nav>
  );
}
