import { useState } from 'react';
import clsx from 'clsx';
import type { AppComponentProps } from '../../Applications';
import type { DailyMealPlan, DietaryRestriction, MealType, NutritionState } from './types';
import { RESTRICTION_LABELS } from './types';
import {
  loadState,
  saveState,
  getPlanForDate,
  upsertPlan,
  saveProfile,
} from './nutritionStorage';
import {
  generateDailyPlan,
  regenerateMeal,
  getMealById,
  getDailyTotals,
  getDailyMessage,
} from './mealEngine';
import './nutrition.css';

const ALL_RESTRICTIONS: DietaryRestriction[] = [
  'no_bread',
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'nut_free',
  'low_carb',
];

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const todayDate = (): string => new Date().toISOString().split('T')[0];

const formatDate = (date: string): string => {
  const d = new Date(date + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

interface MealCardProps {
  mealId: string;
  type: MealType;
  onRegenerate: (type: MealType) => void;
}

const MealCard = ({ mealId, type, onRegenerate }: MealCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const meal = getMealById(mealId);

  if (!meal) {
    return (
      <div className="nutrition-meal-card nutrition-meal-card--empty">
        <div className="nutrition-meal-card__header">
          <span className="nutrition-meal-card__icon">{MEAL_ICONS[type]}</span>
          <span className="nutrition-meal-card__type">{MEAL_LABELS[type]}</span>
        </div>
        <p className="nutrition-meal-card__no-meal">No suitable meal found for your restrictions.</p>
        <button className="nutrition-btn nutrition-btn--ghost" onClick={() => onRegenerate(type)}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={clsx('nutrition-meal-card', { 'nutrition-meal-card--expanded': expanded })}>
      <div className="nutrition-meal-card__header">
        <span className="nutrition-meal-card__icon">{MEAL_ICONS[type]}</span>
        <span className="nutrition-meal-card__type">{MEAL_LABELS[type]}</span>
        <span className="nutrition-meal-card__calories">{meal.calories} kcal</span>
      </div>

      <h3 className="nutrition-meal-card__name">{meal.name}</h3>
      <p className="nutrition-meal-card__desc">{meal.description}</p>

      <div className="nutrition-macros">
        <div className="nutrition-macros__item nutrition-macros__item--protein">
          <span className="nutrition-macros__value">{meal.protein}g</span>
          <span className="nutrition-macros__label">Protein</span>
        </div>
        <div className="nutrition-macros__item nutrition-macros__item--carbs">
          <span className="nutrition-macros__value">{meal.carbs}g</span>
          <span className="nutrition-macros__label">Carbs</span>
        </div>
        <div className="nutrition-macros__item nutrition-macros__item--fat">
          <span className="nutrition-macros__value">{meal.fat}g</span>
          <span className="nutrition-macros__label">Fat</span>
        </div>
        <div className="nutrition-macros__item nutrition-macros__item--fiber">
          <span className="nutrition-macros__value">{meal.fiber}g</span>
          <span className="nutrition-macros__label">Fibre</span>
        </div>
      </div>

      {expanded && (
        <div className="nutrition-meal-card__details">
          <div className="nutrition-meal-card__section">
            <h4 className="nutrition-meal-card__section-title">Ingredients</h4>
            <ul className="nutrition-ingredients">
              {meal.ingredients.map((ing) => (
                <li key={ing} className="nutrition-ingredients__item">
                  {ing}
                </li>
              ))}
            </ul>
          </div>
          <div className="nutrition-meal-card__section">
            <h4 className="nutrition-meal-card__section-title">Preparation</h4>
            <p className="nutrition-meal-card__prep">{meal.preparation}</p>
          </div>
        </div>
      )}

      <div className="nutrition-meal-card__actions">
        <button
          className="nutrition-btn nutrition-btn--ghost"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Hide details' : 'View details'}
        </button>
        <button
          className="nutrition-btn nutrition-btn--ghost nutrition-btn--regen"
          onClick={() => onRegenerate(type)}
          title="Get a different suggestion"
        >
          ↻ Swap
        </button>
      </div>
    </div>
  );
};

const initState = (): NutritionState => {
  const s = loadState();
  const today = todayDate();
  if (getPlanForDate(s.plans, today)) return s;
  const plan = generateDailyPlan(today, s.profile.restrictions, s.plans, null);
  const updatedPlans = upsertPlan(s.plans, plan);
  const next = { ...s, plans: updatedPlans };
  saveState(next);
  return next;
};

export const NutritionAdvisorApp = (_props: AppComponentProps) => {
  const [state, setState] = useState<NutritionState>(initState);
  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState(() => loadState().profile.name);
  const [profileRestrictions, setProfileRestrictions] = useState<DietaryRestriction[]>(
    () => loadState().profile.restrictions
  );
  const [profileSaved, setProfileSaved] = useState(false);

  const today = todayDate();
  const dailyMessage = getDailyMessage();

  const currentPlan: DailyMealPlan | null = getPlanForDate(state.plans, today);

  const handleRegenerate = (type: MealType) => {
    setState((s) => {
      const plan = getPlanForDate(s.plans, today);
      if (!plan) return s;
      const updated = regenerateMeal(plan, type, s.profile.restrictions, s.plans);
      const updatedPlans = upsertPlan(s.plans, updated);
      const next = { ...s, plans: updatedPlans };
      saveState(next);
      return next;
    });
  };

  const handleRegenerateAll = () => {
    setState((s) => {
      const plan = generateDailyPlan(today, s.profile.restrictions, s.plans, null);
      const updatedPlans = upsertPlan(s.plans, plan);
      const next = { ...s, plans: updatedPlans };
      saveState(next);
      return next;
    });
  };

  const handleToggleRestriction = (r: DietaryRestriction) => {
    setProfileRestrictions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const handleSaveProfile = () => {
    const profile = { name: profileName, restrictions: profileRestrictions };
    setState((s) => {
      const next = saveProfile(s, profile);
      // Re-generate today's plan with new restrictions
      const plan = generateDailyPlan(today, profile.restrictions, next.plans, null);
      const updatedPlans = upsertPlan(next.plans, plan);
      const final = { ...next, plans: updatedPlans };
      saveState(final);
      return final;
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const plan = currentPlan;
  const totals = plan ? getDailyTotals(plan) : null;

  return (
    <div className="nutrition">
      <div className="nutrition__hero">
        <div className="nutrition__hero-content">
          <div className="nutrition__hero-text">
            <h1 className="nutrition__title">
              {state.profile.name ? `Welcome back, ${state.profile.name}!` : 'Nutrition Advisor'}
            </h1>
            <p className="nutrition__subtitle">{formatDate(today)}</p>
          </div>
          <button
            className={clsx('nutrition-btn nutrition-btn--ghost nutrition-btn--profile', {
              'nutrition-btn--active': showProfile,
            })}
            onClick={() => setShowProfile((v) => !v)}
          >
            ⚙ Preferences
          </button>
        </div>

        <div className="nutrition__motivation">
          <span className="nutrition__motivation-icon">💬</span>
          <p className="nutrition__motivation-text">{dailyMessage}</p>
        </div>
      </div>

      {showProfile && (
        <div className="nutrition-profile">
          <h2 className="nutrition-profile__title">Your Preferences</h2>
          <div className="nutrition-profile__field">
            <label htmlFor="nutrition-name" className="nutrition-profile__label">
              Your name
            </label>
            <input
              id="nutrition-name"
              type="text"
              className="nutrition-profile__input"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="nutrition-profile__field">
            <label className="nutrition-profile__label">Dietary restrictions</label>
            <div className="nutrition-profile__restrictions">
              {ALL_RESTRICTIONS.map((r) => (
                <label key={r} className="nutrition-restriction-toggle">
                  <input
                    type="checkbox"
                    checked={profileRestrictions.includes(r)}
                    onChange={() => handleToggleRestriction(r)}
                  />
                  <span className="nutrition-restriction-toggle__label">
                    {RESTRICTION_LABELS[r]}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <button className="nutrition-btn nutrition-btn--filled" onClick={handleSaveProfile}>
            {profileSaved ? '✓ Saved!' : 'Save & Update Meals'}
          </button>
        </div>
      )}

      {plan ? (
        <>
          <div className="nutrition__actions">
            <div className="nutrition__daily-totals">
              <span className="nutrition__total-item">
                <strong>{totals?.calories}</strong> kcal
              </span>
              <span className="nutrition__total-sep">·</span>
              <span className="nutrition__total-item">
                <strong>{totals?.protein}g</strong> protein
              </span>
              <span className="nutrition__total-sep">·</span>
              <span className="nutrition__total-item">
                <strong>{totals?.carbs}g</strong> carbs
              </span>
              <span className="nutrition__total-sep">·</span>
              <span className="nutrition__total-item">
                <strong>{totals?.fat}g</strong> fat
              </span>
            </div>
            <button
              className="nutrition-btn nutrition-btn--filled"
              onClick={handleRegenerateAll}
            >
              ↻ New day plan
            </button>
          </div>

          <div className="nutrition__meals">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => {
              const id =
                type === 'breakfast'
                  ? plan.breakfastId
                  : type === 'lunch'
                    ? plan.lunchId
                    : type === 'dinner'
                      ? plan.dinnerId
                      : plan.snackId;
              return (
                <MealCard key={type} mealId={id} type={type} onRegenerate={handleRegenerate} />
              );
            })}
          </div>
        </>
      ) : (
        <div className="nutrition__empty">
          <p>Generating your meal plan…</p>
        </div>
      )}
    </div>
  );
};
