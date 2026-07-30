import {
  SOCKET_EVENTS,
  SharedActivityCreatedEventSchema,
  type CreateSharedActivityInput,
  type SharedActivity,
  type SharedActivityFeedResponse,
} from '@fitnessapp/shared';
import type { AxiosInstance } from 'axios';
import { makeAutoObservable, runInAction } from 'mobx';
import type { Socket } from 'socket.io-client';

export type ActivityStatus = 'idle' | 'loading' | 'ready' | 'error';

export class ActivityStore {
  activities: SharedActivity[] = [];
  status: ActivityStatus = 'idle';
  errorMessage: string | null = null;
  posting = false;

  private readonly api: AxiosInstance;
  private socket: Socket | null = null;
  private reconciling = false;

  constructor(deps: { api: AxiosInstance }) {
    this.api = deps.api;
    makeAutoObservable<this, 'api' | 'socket' | 'reconciling'>(this, {
      api: false,
      socket: false,
      reconciling: false,
    });
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

  bindSocket = (socket: Socket): void => {
    this.unbindSocket();
    this.socket = socket;
    socket.on(SOCKET_EVENTS.activityCreated, this.onActivityCreated);
    socket.on('connect', this.onSocketConnect);
    if (socket.connected) this.onSocketConnect();
  };

  unbindSocket = (): void => {
    if (!this.socket) return;
    this.socket.off(SOCKET_EVENTS.activityCreated, this.onActivityCreated);
    this.socket.off('connect', this.onSocketConnect);
    this.socket = null;
  };

  onActivityCreated = (payload: unknown): void => {
    const parsed = SharedActivityCreatedEventSchema.safeParse(payload);
    if (!parsed.success) return;
    runInAction(() => {
      this.activities = deduplicate([parsed.data.activity, ...this.activities]);
      this.status = 'ready';
    });
  };

  reconcile = async (): Promise<void> => {
    if (this.reconciling) return;
    this.reconciling = true;
    try {
      if (this.activities.length === 0) {
        await this.fetch();
        return;
      }
      let since = this.activities[0]!.createdAt;
      for (let batch = 0; batch < 10; batch += 1) {
        const response = await this.api.get<SharedActivityFeedResponse>(
          '/api/v1/progress/feed',
          { params: { since, limit: 100 } },
        );
        runInAction(() => {
          this.activities = deduplicate([
            ...response.data.activities,
            ...this.activities,
          ]);
        });
        if (response.data.activities.length < 100) break;
        since = response.data.activities[response.data.activities.length - 1]!.createdAt;
      }
    } catch (error) {
      runInAction(() => {
        this.errorMessage = messageOf(error, 'failed to reconcile shared activity');
      });
    } finally {
      this.reconciling = false;
    }
  };

  private onSocketConnect = (): void => {
    void this.reconcile();
  };

  reset = (): void => {
    this.unbindSocket();
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
