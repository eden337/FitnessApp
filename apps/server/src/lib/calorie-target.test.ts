import { calorieTarget } from './calorie-target.js';

describe('calorieTarget', () => {
  it('multiplies BMR by the activity factor for TDEE', () => {
    const { tdeeKcal } = calorieTarget({
      bmrKcal: 1500,
      activityLevel: 'sedentary',
      goalType: 'maintain',
    });
    expect(tdeeKcal).toBe(Math.round(1500 * 1.2));
  });

  it('subtracts 500 kcal for a lose goal', () => {
    const { targetKcal } = calorieTarget({
      bmrKcal: 1800,
      activityLevel: 'moderate',
      goalType: 'lose',
    });
    expect(targetKcal).toBe(Math.round(1800 * 1.55) - 500);
  });

  it('adds 300 kcal for a gain goal', () => {
    const { targetKcal } = calorieTarget({
      bmrKcal: 1800,
      activityLevel: 'moderate',
      goalType: 'gain',
    });
    expect(targetKcal).toBe(Math.round(1800 * 1.55) + 300);
  });

  it('floors the target at 1200 kcal even for aggressive deficits', () => {
    const { targetKcal } = calorieTarget({
      bmrKcal: 1200,
      activityLevel: 'sedentary',
      goalType: 'lose',
    });
    expect(targetKcal).toBe(1200);
  });

  it('returns the same TDEE regardless of goal', () => {
    const a = calorieTarget({ bmrKcal: 1700, activityLevel: 'high', goalType: 'lose' });
    const b = calorieTarget({ bmrKcal: 1700, activityLevel: 'high', goalType: 'gain' });
    expect(a.tdeeKcal).toBe(b.tdeeKcal);
  });
});
