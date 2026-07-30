import type {
  CreateSharedActivityInput,
  SharedActivity,
  SharedActivityFeedQuery,
  SharedActivityFeedResponse,
} from '@fitnessapp/shared';
import type { ActivitiesRepo } from './repo.js';

export const createActivitiesService = (repo: ActivitiesRepo) => ({
  async create(
    userId: string,
    input: CreateSharedActivityInput,
  ): Promise<SharedActivity | { kind: 'not_paired' }> {
    return (await repo.create(userId, input)) ?? { kind: 'not_paired' };
  },

  async feed(
    userId: string,
    query: SharedActivityFeedQuery,
  ): Promise<SharedActivityFeedResponse | { kind: 'not_paired' }> {
    const activities = await repo.listForUser(userId, query);
    return activities ? { activities } : { kind: 'not_paired' };
  },
});

export type ActivitiesService = ReturnType<typeof createActivitiesService>;
