import type {
  CurrentProgramResponse,
  FoodList,
  FoodListsResponse,
  ProgramWeekNumber,
} from '@fitnessapp/shared';
import type { AxiosInstance } from 'axios';
import { makeAutoObservable, runInAction } from 'mobx';

export type ProgramFetchStatus = 'idle' | 'loading' | 'ready' | 'error';

export class ProgramStore {
  current: CurrentProgramResponse | null = null;
  lists: FoodList[] = [];
  status: ProgramFetchStatus = 'idle';
  errorMessage: string | null = null;
  listsStatus: ProgramFetchStatus = 'idle';
  listsErrorMessage: string | null = null;

  private readonly api: AxiosInstance;

  constructor(deps: { api: AxiosInstance }) {
    this.api = deps.api;
    makeAutoObservable<this, 'api'>(this, { api: false });
  }

  async fetch(): Promise<void> {
    runInAction(() => {
      this.status = 'loading';
      this.errorMessage = null;
      this.listsStatus = 'loading';
      this.listsErrorMessage = null;
    });
    try {
      const [current, lists] = await Promise.all([
        this.api.get<CurrentProgramResponse>('/api/v1/program/me/current'),
        this.api.get<FoodListsResponse>('/api/v1/program/lists'),
      ]);
      runInAction(() => {
        this.current = current.data;
        this.lists = lists.data.lists;
        this.status = 'ready';
        this.listsStatus = 'ready';
      });
    } catch (error) {
      runInAction(() => {
        this.status = 'error';
        this.listsStatus = 'error';
        this.errorMessage = messageOf(error, 'failed to load program');
        this.listsErrorMessage = messageOf(error, 'failed to load food lists');
      });
    }
  }

  async start(currentWeekNumber: ProgramWeekNumber): Promise<boolean> {
    runInAction(() => {
      this.status = 'loading';
      this.errorMessage = null;
    });
    try {
      const current = await this.api.post<CurrentProgramResponse>('/api/v1/program/me/start', {
        currentWeekNumber,
      });
      runInAction(() => {
        this.current = current.data;
        this.status = 'ready';
      });
      await this.refreshLists();
      return true;
    } catch (error) {
      runInAction(() => {
        this.status = 'error';
        this.errorMessage = messageOf(error, 'failed to start program');
      });
      return false;
    }
  }

  async refreshLists(): Promise<boolean> {
    runInAction(() => {
      this.listsStatus = 'loading';
      this.listsErrorMessage = null;
    });
    try {
      const lists = await this.api.get<FoodListsResponse>('/api/v1/program/lists');
      runInAction(() => {
        this.lists = lists.data.lists;
        this.listsStatus = 'ready';
      });
      return true;
    } catch (error) {
      runInAction(() => {
        this.listsStatus = 'error';
        this.listsErrorMessage = messageOf(error, 'failed to load food lists');
      });
      return false;
    }
  }

  reset = (): void => {
    runInAction(() => {
      this.current = null;
      this.lists = [];
      this.status = 'idle';
      this.errorMessage = null;
      this.listsStatus = 'idle';
      this.listsErrorMessage = null;
    });
  };
}

const messageOf = (error: unknown, fallback: string): string => {
  const response = (
    error as { response?: { data?: { error?: { code?: string; message?: string } } } }
  )?.response?.data?.error;
  return response?.code ?? response?.message ?? fallback;
};
