"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string | null;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}

function initials(name: string | null) {
  if (!name) return "D1";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "D1";
}

export function Avatar({ name, photoUrl, size = 44, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showPhoto = photoUrl && !failed;

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-habits to-workouts font-bold text-white",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element -- внешний URL аватара Telegram
        <img src={photoUrl} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
