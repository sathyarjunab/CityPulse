"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type NavLinkProps = {
  href: string;
  // Extra sections that should also light this link up, e.g. /favorites for My feed.
  matches?: string[];
  children: ReactNode;
};

export function NavLink({ href, matches = [], children }: NavLinkProps) {
  const pathname = usePathname();
  const active = [href, ...matches].some((path) => pathname === path || pathname.startsWith(`${path}/`));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-xl border-2 px-3 text-sm font-bold whitespace-nowrap transition-[transform,box-shadow,background-color] duration-150 max-sm:px-2",
        active
          ? "-translate-x-px -translate-y-px border-ink bg-lime shadow-pop-sm"
          : "border-transparent hover:border-ink hover:bg-white",
      )}
    >
      {children}
    </Link>
  );
}
