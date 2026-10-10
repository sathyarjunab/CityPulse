import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <div className="grid gap-8">
      <h1 className="text-4xl leading-none font-extrabold sm:text-6xl">
        Admin <span aria-hidden>🛡️</span>
      </h1>
      <Suspense fallback={<div className="card-pop h-40 animate-pulse" aria-hidden />}>
        <AdminWelcome />
      </Suspense>
    </div>
  );
}

async function AdminWelcome() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/events");

  const admin = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true } });
  if (!admin) redirect("/login?next=/admin");

  return (
    <div className="card-pop grid justify-items-center gap-3 px-6 py-14 text-center">
      <span className="text-5xl" aria-hidden>
        👋
      </span>
      <h2 className="text-2xl font-extrabold">Hey, {admin.email}</h2>
      <p className="max-w-sm text-muted">Event management will live here.</p>
    </div>
  );
}
