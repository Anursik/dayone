"use client";

import { useLiveQuery } from "dexie-react-hooks";
import type { Profile } from "@/lib/db/schemas";
import { profileRepository } from "@/lib/repositories";

/** Профиль из локальной базы. undefined — ещё загружается. */
export function useProfile(): Profile | undefined {
  return useLiveQuery(() => profileRepository.get(), []);
}
