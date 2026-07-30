import type {
  CreateSharedActivityInput,
  SharedActivity,
  SharedActivityFeedQuery,
  SharedActivityFeedResponse,
} from '@fitnessapp/shared';
import type { ActivitiesRepo } from './repo.js';

export type ActivityEventEmitter = {
  emitActivityCreated: (
    coupleId: string,
    payload: { activity: SharedActivity },
  ) => void;
};

const noEvents: ActivityEventEmitter = {
  emitActivityCreated: () => undefined,
};

export const createActivitiesService = (deps: {
  repo: ActivitiesRepo;
  events?: ActivityEventEmitter;
}) => {
  const events = deps.events ?? noEvents;
  return {
    async create(
      userId: string,
      input: CreateSharedActivityInput,
    ): Promise<SharedActivity | { kind: 'not_paired' }> {
      const activity = await deps.repo.create(userId, input);
      if (!activity) return { kind: 'not_paired' };
      events.emitActivityCreated(activity.coupleId, { activity });
      return activity;
    },

    async feed(
      userId: string,
      query: SharedActivityFeedQuery,
    ): Promise<SharedActivityFeedResponse | { kind: 'not_paired' }> {
      const activities = await deps.repo.listForUser(userId, query);
      return activities ? { activities } : { kind: 'not_paired' };
    },
  };
};

export type ActivitiesService = ReturnType<typeof createActivitiesService>;
