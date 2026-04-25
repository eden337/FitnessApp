import type { ActivityLevel, GoalType } from '../db/types.js';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
};

const GOAL_DELTA_KCAL: Record<GoalType, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export type CalorieTargetInput = {
  bmrKcal: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
};

/**
 * Total daily energy expenditure (TDEE) and the calorie target after the
 * goal adjustment.
 *
 * - tdeeKcal: BMR * activity factor.
 * - targetKcal: TDEE + goal delta. Floored at a 1200 kcal safety floor so
 *   an aggressive `lose` goal on a small frame can't produce a clinically
 *   unsafe target.
 */
export const calorieTarget = ({
  bmrKcal,
  activityLevel,
  goalType,
}: CalorieTargetInput): { tdeeKcal: number; targetKcal: number } => {
  const tdee = bmrKcal * ACTIVITY_FACTORS[activityLevel];
  const target = Math.max(1200, tdee + GOAL_DELTA_KCAL[goalType]);
  return {
    tdeeKcal: Math.round(tdee),
    targetKcal: Math.round(target),
  };
};
