import { makeAutoObservable, runInAction } from 'mobx';
import type { AxiosInstance } from 'axios';
import type { UserProfile, Locale } from '@fitnessapp/shared';
import { STORAGE_KEYS, type SecureStorage } from '../services/secureStorage';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export type RegisterPayload = {
  email: string;
  password: string;
  displayName: string;
  locale: Locale;
  gender: 'female' | 'male' | 'other';
  birthDate: string; // YYYY-MM-DD
  heightCm: number;
};

export type AuthStoreDeps = {
  api: AxiosInstance;
  storage: SecureStorage;
};

/**
 * Holds the authenticated user and tokens. Tokens live on the instance (not
 * in any persisted state for the access side) so they can be read
 * synchronously by the api client's request interceptor. The refresh token
 * is persisted via the injected secure storage.
 *
 * Note on observability: `accessToken` and `refreshToken` are intentionally
 * NOT marked observable — components don't render off them, and keeping them
 * out of MobX observation prevents needless re-renders on every refresh.
 */
export class AuthStore {
  user: UserProfile | null = null;
  status: AuthStatus = 'idle';
  errorMessage: string | null = null;

  private readonly api: AxiosInstance;
  private readonly storage: SecureStorage;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(deps: AuthStoreDeps) {
    this.api = deps.api;
    this.storage = deps.storage;
    makeAutoObservable<this, 'api' | 'storage' | 'accessToken' | 'refreshToken'>(this, {
      api: false,
      storage: false,
      accessToken: false,
      refreshToken: false,
    });
  }

  // Read-side accessors used by the api client. Plain methods (not observable).
  getTokens = (): { accessToken: string | null; refreshToken: string | null } => ({
    accessToken: this.accessToken,
    refreshToken: this.refreshToken,
  });

  setTokens = (tokens: { accessToken: string | null; refreshToken: string | null }): void => {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    if (tokens.refreshToken) void this.storage.set(STORAGE_KEYS.refreshToken, tokens.refreshToken);
    else void this.storage.remove(STORAGE_KEYS.refreshToken);
  };

  /** Try to silently restore a session from secure storage on app launch. */
  async hydrate(): Promise<void> {
    runInAction(() => {
      this.status = 'loading';
    });
    const refresh = await this.storage.get(STORAGE_KEYS.refreshToken);
    if (!refresh) {
      runInAction(() => {
        this.status = 'unauthenticated';
      });
      return;
    }
    try {
      const res = await this.api.post('/api/v1/auth/refresh', { refreshToken: refresh });
      const data = res.data as {
        accessToken: string;
        refreshToken: string;
        user: UserProfile;
      };
      this.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      runInAction(() => {
        this.user = data.user;
        this.status = 'authenticated';
        this.errorMessage = null;
      });
    } catch {
      this.setTokens({ accessToken: null, refreshToken: null });
      runInAction(() => {
        this.status = 'unauthenticated';
      });
    }
  }

  async signUp(payload: RegisterPayload): Promise<boolean> {
    runInAction(() => {
      this.status = 'loading';
      this.errorMessage = null;
    });
    try {
      const res = await this.api.post('/api/v1/auth/register', payload);
      const data = res.data as {
        accessToken: string;
        refreshToken: string;
        user: UserProfile;
      };
      this.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      runInAction(() => {
        this.user = data.user;
        this.status = 'authenticated';
      });
      return true;
    } catch (err) {
      runInAction(() => {
        this.status = 'error';
        this.errorMessage = errorMessageOf(err, 'sign-up failed');
      });
      return false;
    }
  }

  async signIn(email: string, password: string): Promise<boolean> {
    runInAction(() => {
      this.status = 'loading';
      this.errorMessage = null;
    });
    try {
      const res = await this.api.post('/api/v1/auth/login', { email, password });
      const data = res.data as {
        accessToken: string;
        refreshToken: string;
        user: UserProfile;
      };
      this.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      runInAction(() => {
        this.user = data.user;
        this.status = 'authenticated';
      });
      return true;
    } catch (err) {
      runInAction(() => {
        this.status = 'error';
        this.errorMessage = errorMessageOf(err, 'sign-in failed');
      });
      return false;
    }
  }

  async signOut(): Promise<void> {
    const refresh = this.refreshToken;
    if (refresh) {
      try {
        await this.api.post('/api/v1/auth/logout', { refreshToken: refresh });
      } catch {
        // Best-effort: even if the network fails we still clear local state.
      }
    }
    this.setTokens({ accessToken: null, refreshToken: null });
    runInAction(() => {
      this.user = null;
      this.status = 'unauthenticated';
      this.errorMessage = null;
    });
  }

  /** Forced sign-out triggered by the api client when refresh fails. */
  handleAuthFailure = (): void => {
    this.setTokens({ accessToken: null, refreshToken: null });
    runInAction(() => {
      this.user = null;
      this.status = 'unauthenticated';
    });
  };

  setUser = (user: UserProfile): void => {
    this.user = user;
  };
}

const errorMessageOf = (err: unknown, fallback: string): string => {
  const r = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })
    ?.response?.data?.error;
  if (r?.code) return r.code;
  if (r?.message) return r.message;
  return fallback;
};
