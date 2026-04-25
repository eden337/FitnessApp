import { makeAutoObservable, runInAction } from 'mobx';
import type { AxiosInstance } from 'axios';
import type {
  DerivedUserMetrics,
  ProfileSetupInput,
  UpdateMetricsInput,
  UpdateProfileInput,
  UserMetrics,
  UserProfile,
} from '@fitnessapp/shared';
import type { AuthStore } from './AuthStore';

export type ProfileFetchStatus = 'idle' | 'loading' | 'ready' | 'error';

export type ProfileStoreDeps = {
  api: AxiosInstance;
  authStore: AuthStore;
};

type FullProfileResponse = {
  profile: UserProfile;
  metrics: UserMetrics | null;
  derived: DerivedUserMetrics | null;
};

/**
 * Owns profile + metrics state for the current user. Reads server-derived
 * BMR/TDEE/target so the UI never recomputes them client-side.
 */
export class ProfileStore {
  profile: UserProfile | null = null;
  metrics: UserMetrics | null = null;
  derived: DerivedUserMetrics | null = null;
  status: ProfileFetchStatus = 'idle';
  errorMessage: string | null = null;

  private readonly api: AxiosInstance;
  private readonly authStore: AuthStore;

  constructor(deps: ProfileStoreDeps) {
    this.api = deps.api;
    this.authStore = deps.authStore;
    makeAutoObservable<this, 'api' | 'authStore'>(this, { api: false, authStore: false });
  }

  get isMetricsInitialized(): boolean {
    return this.metrics !== null;
  }

  async fetch(): Promise<void> {
    runInAction(() => {
      this.status = 'loading';
      this.errorMessage = null;
    });
    try {
      const res = await this.api.get<FullProfileResponse>('/api/v1/users/me/profile');
      runInAction(() => {
        this.profile = res.data.profile;
        this.metrics = res.data.metrics;
        this.derived = res.data.derived;
        this.status = 'ready';
      });
      this.authStore.setUser(res.data.profile);
    } catch (err) {
      runInAction(() => {
        this.status = 'error';
        this.errorMessage = messageOf(err, 'failed to load profile');
      });
    }
  }

  async setupMetrics(input: ProfileSetupInput): Promise<boolean> {
    return this.put('/api/v1/users/me/metrics', input);
  }

  async updateProfile(patch: UpdateProfileInput): Promise<boolean> {
    return this.patch('/api/v1/users/me/profile', patch);
  }

  async updateMetrics(patch: UpdateMetricsInput): Promise<boolean> {
    return this.patch('/api/v1/users/me/metrics', patch);
  }

  private async put(url: string, body: unknown): Promise<boolean> {
    try {
      const res = await this.api.put<FullProfileResponse>(url, body);
      this.applyResult(res.data);
      return true;
    } catch (err) {
      runInAction(() => {
        this.errorMessage = messageOf(err, 'request failed');
      });
      return false;
    }
  }

  private async patch(url: string, body: unknown): Promise<boolean> {
    try {
      const res = await this.api.patch<FullProfileResponse>(url, body);
      this.applyResult(res.data);
      return true;
    } catch (err) {
      runInAction(() => {
        this.errorMessage = messageOf(err, 'request failed');
      });
      return false;
    }
  }

  private applyResult(data: FullProfileResponse): void {
    runInAction(() => {
      this.profile = data.profile;
      this.metrics = data.metrics;
      this.derived = data.derived;
      this.status = 'ready';
      this.errorMessage = null;
    });
    this.authStore.setUser(data.profile);
  }

  reset = (): void => {
    runInAction(() => {
      this.profile = null;
      this.metrics = null;
      this.derived = null;
      this.status = 'idle';
      this.errorMessage = null;
    });
  };
}

const messageOf = (err: unknown, fallback: string): string => {
  const r = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })
    ?.response?.data?.error;
  return r?.code ?? r?.message ?? fallback;
};
