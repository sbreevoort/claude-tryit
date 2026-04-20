export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type DietaryRestriction =
  | 'no_bread'
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'dairy_free'
  | 'nut_free'
  | 'low_carb';

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: string[];
  preparation: string;
  excludeFor: DietaryRestriction[];
}

export interface UserProfile {
  name: string;
  restrictions: DietaryRestriction[];
}

export interface DailyMealPlan {
  date: string;
  breakfastId: string;
  lunchId: string;
  dinnerId: string;
  snackId: string;
}

export interface NutritionState {
  profile: UserProfile;
  plans: DailyMealPlan[];
}

export const RESTRICTION_LABELS: Record<DietaryRestriction, string> = {
  no_bread: 'No Bread / Grains',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  gluten_free: 'Gluten Free',
  dairy_free: 'Dairy Free',
  nut_free: 'Nut Free',
  low_carb: 'Low Carb',
};
