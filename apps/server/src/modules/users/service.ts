import type {
  DerivedUserMetrics,
  UpdateMetricsInput,
  UpdateProfileInput,
  UserMetrics,
  UserProfile,
} from '@fitnessapp/shared';
import { ageFromBirthDate, bmrKcal, bodyMassIndex } from '../../lib/bmr.js';
import { calorieTarget } from '../../lib/calorie-target.js';
import type { AuthRepo } from '../auth/repo.js';
import type { UsersRepo } from './repo.js';

export type FullProfile = {
  profile: UserProfile;
  metrics: UserMetrics | null;
  derived: DerivedUserMetrics | null;
};

export const createUsersService = (deps: { repo: UsersRepo; authRepo: AuthRepo }) => {
  const { repo, authRepo } = deps;

  return {
    async getFullProfile(userId: string): Promise<FullProfile | null> {
      const user = await authRepo.findUserById(userId);
      if (!user) return null;
      const profile: UserProfile = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        locale: user.locale,
        gender: user.gender,
        birthDate: user.birthDate,
        heightCm: user.heightCm,
      };
      const metrics = await repo.getMetrics(userId);
      const derived = metrics ? computeDerived(profile, metrics) : null;
      return { profile, metrics, derived };
    },

    async updateProfile(userId: string, patch: UpdateProfileInput): Promise<FullProfile | null> {
      await repo.updateProfile(userId, patch);
      return this.getFullProfile(userId);
    },

    async updateMetrics(userId: string, patch: UpdateMetricsInput): Promise<FullProfile | null> {
      const existing = await repo.getMetrics(userId);
      if (!existing) {
        // initial setup requires a complete metrics object, not a patch.
        return null;
      }
      await repo.updateMetrics(userId, patch);
      return this.getFullProfile(userId);
    },

    async setupMetrics(userId: string, metrics: UserMetrics): Promise<FullProfile | null> {
      await repo.upsertMetrics(userId, metrics);
      return this.getFullProfile(userId);
    },
  };
};

export type UsersService = ReturnType<typeof createUsersService>;

const computeDerived = (profile: UserProfile, metrics: UserMetrics): DerivedUserMetrics => {
  const ageYears = ageFromBirthDate(new Date(`${profile.birthDate}T00:00:00Z`));
  const bmr = bmrKcal({
    gender: profile.gender,
    weightKg: metrics.currentWeightKg,
    heightCm: profile.heightCm,
    ageYears,
  });
  const { tdeeKcal, targetKcal } = calorieTarget({
    bmrKcal: bmr,
    activityLevel: metrics.activityLevel,
    goalType: metrics.goalType,
  });
  return {
    ageYears,
    bmi: bodyMassIndex(metrics.currentWeightKg, profile.heightCm),
    bmrKcal: bmr,
    tdeeKcal,
    targetKcal,
  };
};
