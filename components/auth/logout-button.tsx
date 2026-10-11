"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function logout() {
    setPending(true);
    setFailed(false);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      setPending(false);
      router.replace("/login");
      router.refresh();
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="max-sm:px-2.5"
      onClick={logout}
      loading={pending}
      title={failed ? "Couldn't log out. Try again." : undefined}
    >
      {!pending && <LogOut className="size-4" aria-hidden />}
      <span className="max-sm:sr-only">{failed ? "Try again" : "Log out"}</span>
    </Button>
  );
}
