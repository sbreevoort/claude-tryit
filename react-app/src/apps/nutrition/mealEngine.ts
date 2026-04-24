import type { Meal, MealType, DietaryRestriction, DailyMealPlan } from './types';
import { meals, motivationalMessages, childMessages } from './mealData';

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

const pickRandom = <T>(arr: T[], seed: number): T => {
  return arr[Math.floor(seededRandom(seed) * arr.length)];
};

export const getEligibleMeals = (type: MealType, restrictions: DietaryRestriction[], childMode = false): Meal[] => {
  return meals.filter(
    (m) =>
      m.type === type &&
      !m.excludeFor.some((r) => restrictions.includes(r)) &&
      (childMode ? m.kidFriendly === true : !m.kidFriendly)
  );
};

const getRecentlyUsedIds = (plans: DailyMealPlan[], type: MealType, excludeDate: string): string[] => {
  const recentPlans = plans
    .filter((p) => p.date !== excludeDate)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  return recentPlans.map((p) => {
    if (type === 'breakfast') return p.breakfastId;
    if (type === 'lunch') return p.lunchId;
    if (type === 'dinner') return p.dinnerId;
    return p.snackId;
  });
};

export const pickMeal = (
  type: MealType,
  restrictions: DietaryRestriction[],
  plans: DailyMealPlan[],
  date: string,
  seed: number,
  childMode = false
): Meal | null => {
  const eligible = getEligibleMeals(type, restrictions, childMode);
  if (eligible.length === 0) return null;

  const recentIds = getRecentlyUsedIds(plans, type, date);
  const fresh = eligible.filter((m) => !recentIds.includes(m.id));
  const pool = fresh.length > 0 ? fresh : eligible;
  return pickRandom(pool, seed);
};

export const generateDailyPlan = (
  date: string,
  restrictions: DietaryRestriction[],
  plans: DailyMealPlan[],
  existingPlan?: DailyMealPlan | null,
  childMode = false
): DailyMealPlan => {
  const dateSeed = date.split('-').reduce((acc, n) => acc + parseInt(n, 10), 0);
  const now = Date.now();

  const breakfast = pickMeal('breakfast', restrictions, plans, date, dateSeed + now, childMode);
  const lunch = pickMeal('lunch', restrictions, plans, date, dateSeed + now + 1, childMode);
  const dinner = pickMeal('dinner', restrictions, plans, date, dateSeed + now + 2, childMode);
  const snack = pickMeal('snack', restrictions, plans, date, dateSeed + now + 3, childMode);

  return {
    date,
    breakfastId: breakfast?.id ?? existingPlan?.breakfastId ?? '',
    lunchId: lunch?.id ?? existingPlan?.lunchId ?? '',
    dinnerId: dinner?.id ?? existingPlan?.dinnerId ?? '',
    snackId: snack?.id ?? existingPlan?.snackId ?? '',
  };
};

export const regenerateMeal = (
  plan: DailyMealPlan,
  type: MealType,
  restrictions: DietaryRestriction[],
  plans: DailyMealPlan[],
  childMode = false
): DailyMealPlan => {
  const meal = pickMeal(type, restrictions, plans, plan.date, Date.now(), childMode);
  if (!meal) return plan;
  const updated = { ...plan };
  if (type === 'breakfast') updated.breakfastId = meal.id;
  else if (type === 'lunch') updated.lunchId = meal.id;
  else if (type === 'dinner') updated.dinnerId = meal.id;
  else updated.snackId = meal.id;
  return updated;
};

export const getMealById = (id: string): Meal | undefined => meals.find((m) => m.id === id);

export const getDailyTotals = (plan: DailyMealPlan) => {
  const ids = [plan.breakfastId, plan.lunchId, plan.dinnerId, plan.snackId];
  return ids.reduce(
    (acc, id) => {
      const meal = getMealById(id);
      if (!meal) return acc;
      return {
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
        fiber: acc.fiber + meal.fiber,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
};

export const getDailyMessage = (childMode = false): string => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const messages = childMode ? childMessages : motivationalMessages;
  return messages[dayOfYear % messages.length];
};
