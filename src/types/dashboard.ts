export interface MacroValue {
  /** Съедено, г */
  eaten: number;
  /** Норма, г (null — не задана) */
  goal: number | null;
}

export interface DashboardSummary {
  profileName: string | null;
  habits: { done: number; total: number };
  nutrition: {
    calories: number;
    caloriesGoal: number | null;
    protein: MacroValue;
    fat: MacroValue;
    carbs: MacroValue;
  };
  water: { ml: number; goalMl: number | null };
  sleep: { minutes: number | null; goalMinutes: number | null };
  lastWorkout: { title: string; date: Date; durationMinutes: number | null } | null;
}

export const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  profileName: null,
  habits: { done: 0, total: 0 },
  nutrition: {
    calories: 0,
    caloriesGoal: null,
    protein: { eaten: 0, goal: null },
    fat: { eaten: 0, goal: null },
    carbs: { eaten: 0, goal: null },
  },
  water: { ml: 0, goalMl: null },
  sleep: { minutes: null, goalMinutes: null },
  lastWorkout: null,
};
