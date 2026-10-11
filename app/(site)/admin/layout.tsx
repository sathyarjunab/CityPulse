import { Suspense, type ReactNode } from "react";
import { requireAdminSession } from "@/lib/auth/session";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdminSession();
  return children;
}

function AdminShellSkeleton() {
  return (
    <div className="grid animate-pulse gap-8" aria-hidden>
      <div className="h-14 w-64 rounded-xl bg-ink/10" />
      <div className="card-pop h-64" />
    </div>
  );
}
