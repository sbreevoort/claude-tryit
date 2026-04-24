import type { NutritionState, UserProfile, DailyMealPlan, DietaryRestriction } from './types';

const STORAGE_KEY = 'nutrition-advisor-data';

const defaultState: NutritionState = {
  profile: {
    name: '',
    restrictions: ['no_bread' as DietaryRestriction],
    childMode: false,
  },
  plans: [],
};

export const loadState = (): NutritionState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    return JSON.parse(raw) as NutritionState;
  } catch {
    return { ...defaultState };
  }
};

export const saveState = (state: NutritionState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const getPlanForDate = (plans: DailyMealPlan[], date: string): DailyMealPlan | null => {
  return plans.find((p) => p.date === date) ?? null;
};

export const upsertPlan = (plans: DailyMealPlan[], plan: DailyMealPlan): DailyMealPlan[] => {
  const existing = plans.findIndex((p) => p.date === plan.date);
  if (existing >= 0) {
    return plans.map((p, i) => (i === existing ? plan : p));
  }
  // Keep only last 30 days to avoid unbounded growth
  const updated = [...plans, plan];
  if (updated.length > 30) return updated.slice(-30);
  return updated;
};

export const saveProfile = (state: NutritionState, profile: UserProfile): NutritionState => {
  const next = { ...state, profile };
  saveState(next);
  return next;
};
