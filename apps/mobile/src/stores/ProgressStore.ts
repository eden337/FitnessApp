import type {
  CreateWeightLogInput,
  WeightHistoryResponse,
  WeightLog,
} from '@fitnessapp/shared';
import type { AxiosInstance } from 'axios';
import { makeAutoObservable, runInAction } from 'mobx';

export type ProgressFetchStatus = 'idle' | 'loading' | 'ready' | 'error';

export class ProgressStore {
  logs: WeightLog[] = [];
  status: ProgressFetchStatus = 'idle';
  errorMessage: string | null = null;

  private readonly api: AxiosInstance;
  private readonly afterLog: () => Promise<void>;

  constructor(deps: {
    api: AxiosInstance;
    afterLog?: () => Promise<void>;
  }) {
    this.api = deps.api;
    this.afterLog = deps.afterLog ?? (async () => undefined);
    makeAutoObservable<this, 'api' | 'afterLog'>(this, {
      api: false,
      afterLog: false,
    });
  }

  async fetch(): Promise<void> {
    runInAction(() => {
      this.status = 'loading';
      this.errorMessage = null;
    });
    try {
      const response = await this.api.get<WeightHistoryResponse>('/api/v1/progress/weight', {
        params: { limit: 365 },
      });
      runInAction(() => {
        this.logs = response.data.logs;
        this.status = 'ready';
      });
    } catch (error) {
      runInAction(() => {
        this.status = 'error';
        this.errorMessage = messageOf(error, 'failed to load weight history');
      });
    }
  }

  async logWeight(input: CreateWeightLogInput): Promise<boolean> {
    runInAction(() => {
      this.errorMessage = null;
    });
    try {
      const response = await this.api.post<WeightLog>('/api/v1/progress/weight', input);
      runInAction(() => {
        this.logs = [
          response.data,
          ...this.logs.filter((entry) => entry.loggedOn !== response.data.loggedOn),
        ].sort((left, right) => right.loggedOn.localeCompare(left.loggedOn));
        this.status = 'ready';
      });
      await this.afterLog();
      return true;
    } catch (error) {
      runInAction(() => {
        this.status = 'error';
        this.errorMessage = messageOf(error, 'failed to log weight');
      });
      return false;
    }
  }

  reset = (): void => {
    runInAction(() => {
      this.logs = [];
      this.status = 'idle';
      this.errorMessage = null;
    });
  };
}

const messageOf = (error: unknown, fallback: string): string => {
  const response = (
    error as { response?: { data?: { error?: { code?: string; message?: string } } } }
  )?.response?.data?.error;
  return response?.code ?? response?.message ?? fallback;
};
