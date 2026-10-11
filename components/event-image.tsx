"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

type EventImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

// Event images come from any admin-provided URL, so they skip Next's optimizer
// (which would need every host allow-listed) and fall back gracefully when broken.
export function EventImage({ src, alt, sizes, className, priority }: EventImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return (
    <div className={cn("relative overflow-hidden bg-ink/5", className)}>
      {failedSrc === src ? (
        <div className="absolute inset-0 grid place-items-center text-muted">
          <ImageOff className="size-6" aria-hidden />
          <span className="sr-only">Image unavailable</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized
          priority={priority}
          onError={() => setFailedSrc(src)}
          className="object-cover"
        />
      )}
    </div>
  );
}
