import type {
  CreateWeightLogInput,
  WeightHistoryQuery,
  WeightHistoryResponse,
  WeightLog,
} from '@fitnessapp/shared';
import { todayInIsrael } from '../../lib/israel-date.js';
import type { ProgressRepo } from './repo.js';

export const createProgressService = (deps: {
  repo: ProgressRepo;
  today?: () => string;
}) => {
  const today = deps.today ?? (() => todayInIsrael());

  return {
    async logWeight(
      userId: string,
      input: CreateWeightLogInput,
    ): Promise<WeightLog | { kind: 'missing_metrics' | 'future_date' }> {
      const serverToday = today();
      const loggedOn = input.loggedOn ?? serverToday;
      if (loggedOn > serverToday) return { kind: 'future_date' };
      const log = await deps.repo.upsertWeightLog(userId, {
        loggedOn,
        weightKg: input.weightKg,
        bodyFatPct: input.bodyFatPct ?? null,
        notes: input.notes ?? null,
      });
      return log ?? { kind: 'missing_metrics' };
    },

    async getWeightHistory(
      userId: string,
      query: WeightHistoryQuery,
    ): Promise<WeightHistoryResponse> {
      return { logs: await deps.repo.listWeightLogs(userId, query) };
    },
  };
};

export type ProgressService = ReturnType<typeof createProgressService>;
