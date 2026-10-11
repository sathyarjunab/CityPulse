"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      offset={88}
      mobileOffset={84}
      icons={{
        success: <CircleCheck className="size-5 text-lime" aria-hidden />,
        error: <CircleAlert className="size-5 text-danger" aria-hidden />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-xl border-2 border-ink bg-ink px-4 py-3 font-sans text-sm font-bold text-paper",
          default: "shadow-pop-pink",
          error: "shadow-pop-danger",
          success: "shadow-pop-lime",
          description: "font-normal text-paper/80",
        },
      }}
    />
  );
}
