import { PROFILE_ID, profileSchema, type Goals, type Profile } from "@/lib/db/schemas";
import { withDataErrors } from "@/lib/db/errors";
import { createRepository } from "./create-repository";

const base = createRepository("profile", profileSchema, "id");

export const EMPTY_GOALS: Goals = {
  caloriesKcal: null,
  proteinG: null,
  fatG: null,
  carbsG: null,
  waterMl: null,
  sleepMinutes: null,
  stepsTarget: null,
  targetWeightKg: null,
};

export type ProfilePatch = Partial<Omit<Profile, "id" | "createdAt" | "updatedAt" | "goals">> & {
  goals?: Partial<Goals>;
};

export const profileRepository = {
  get(): Promise<Profile | undefined> {
    return base.get(PROFILE_ID);
  },

  /** Создаёт профиль при первом запуске. Имя из Telegram — только начальное значение. */
  async ensure(initialName: string | null): Promise<Profile> {
    return withDataErrors(async () => {
      const existing = await base.get(PROFILE_ID);
      if (existing) return existing;
      const now = Date.now();
      return base.put({
        id: PROFILE_ID,
        name: (initialName ?? "").trim().slice(0, 60),
        age: null,
        heightCm: null,
        weightKg: null,
        goals: EMPTY_GOALS,
        createdAt: now,
        updatedAt: now,
      });
    });
  },

  async update(patch: ProfilePatch): Promise<Profile> {
    return withDataErrors(async () => {
      const current = (await base.get(PROFILE_ID)) ?? (await profileRepository.ensure(null));
      return base.put({
        ...current,
        ...patch,
        goals: { ...current.goals, ...patch.goals },
        id: PROFILE_ID,
        updatedAt: Date.now(),
      });
    });
  },
};
