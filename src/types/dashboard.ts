export interface MacroValue {
  /** Съедено, г */
  eaten: number;
  /** Норма, г (null — не задана) */
  goal: number | null;
}

export interface DashboardSummary {
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
