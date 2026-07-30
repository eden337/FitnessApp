import type {
  CreateSharedActivityInput,
  SharedActivity,
  SharedActivityFeedResponse,
} from '@fitnessapp/shared';
import type { AxiosInstance } from 'axios';
import { makeAutoObservable, runInAction } from 'mobx';

export type ActivityStatus = 'idle' | 'loading' | 'ready' | 'error';

export class ActivityStore {
  activities: SharedActivity[] = [];
  status: ActivityStatus = 'idle';
  errorMessage: string | null = null;
  posting = false;

  private readonly api: AxiosInstance;

  constructor(deps: { api: AxiosInstance }) {
    this.api = deps.api;
    makeAutoObservable<this, 'api'>(this, { api: false });
  }

  async fetch(): Promise<void> {
    runInAction(() => {
      this.status = 'loading';
      this.errorMessage = null;
    });
    try {
      const response = await this.api.get<SharedActivityFeedResponse>(
        '/api/v1/progress/feed',
        { params: { limit: 30 } },
      );
      runInAction(() => {
        this.activities = deduplicate(response.data.activities);
        this.status = 'ready';
      });
    } catch (error) {
      runInAction(() => {
        this.status = 'error';
        this.errorMessage = messageOf(error, 'failed to load shared activity');
      });
    }
  }

  async share(input: CreateSharedActivityInput): Promise<boolean> {
    runInAction(() => {
      this.posting = true;
      this.errorMessage = null;
    });
    try {
      const response = await this.api.post<SharedActivity>(
        '/api/v1/progress/activities',
        input,
      );
      runInAction(() => {
        this.activities = deduplicate([response.data, ...this.activities]);
        this.status = 'ready';
        this.posting = false;
      });
      return true;
    } catch (error) {
      runInAction(() => {
        this.errorMessage = messageOf(error, 'failed to share activity');
        this.posting = false;
      });
      return false;
    }
  }

  reset = (): void => {
    runInAction(() => {
      this.activities = [];
      this.status = 'idle';
      this.errorMessage = null;
      this.posting = false;
    });
  };
}

const deduplicate = (activities: readonly SharedActivity[]): SharedActivity[] => [
  ...new Map(activities.map((activity) => [activity.id, activity])).values(),
].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

const messageOf = (error: unknown, fallback: string): string => {
  const response = (
    error as { response?: { data?: { error?: { code?: string; message?: string } } } }
  )?.response?.data?.error;
  return response?.code ?? response?.message ?? fallback;
};
