import type { AxiosInstance } from 'axios';
import { createApiClient } from '../services/apiClient';
import type { SecureStorage } from '../services/secureStorage';
import { AuthStore } from './AuthStore';
import { CoupleStore } from './CoupleStore';
import { LocaleStore, type LocaleStoreDeps } from './LocaleStore';
import { ProfileStore } from './ProfileStore';
import { ProgramStore } from './ProgramStore';
import { ProgressStore } from './ProgressStore';
import { ThemeStore } from './ThemeStore';
import { ActivityStore } from './ActivityStore';

export type RootStoreDeps = {
  baseURL: string;
  storage: SecureStorage;
  setI18nLanguage: LocaleStoreDeps['setI18nLanguage'];
  setRtl: LocaleStoreDeps['setRtl'];
  initialLocale?: 'he' | 'en';
  /** Optional pre-built axios instance — useful for tests. */
  api?: AxiosInstance;
};

/**
 * Composition root for the mobile app. Creates the api client + stores in
 * the right order so the api client's auth interceptor can read tokens from
 * the AuthStore and signal failures back to it.
 */
export class RootStore {
  readonly auth: AuthStore;
  readonly activity: ActivityStore;
  readonly profile: ProfileStore;
  readonly couple: CoupleStore;
  readonly locale: LocaleStore;
  readonly program: ProgramStore;
  readonly progress: ProgressStore;
  readonly theme: ThemeStore;
  readonly api: AxiosInstance;

  constructor(deps: RootStoreDeps) {
    let auth!: AuthStore;
    this.api =
      deps.api ??
      createApiClient({
        baseURL: deps.baseURL,
        getTokens: () => auth.getTokens(),
        setTokens: (t) => auth.setTokens(t),
        onAuthFailure: () => auth.handleAuthFailure(),
      });
    auth = new AuthStore({ api: this.api, storage: deps.storage });
    this.auth = auth;
    this.activity = new ActivityStore({ api: this.api });
    this.profile = new ProfileStore({ api: this.api, authStore: this.auth });
    this.couple = new CoupleStore({ api: this.api });
    this.program = new ProgramStore({ api: this.api });
    this.progress = new ProgressStore({
      api: this.api,
      afterLog: () => this.profile.fetch(),
    });
    this.locale = new LocaleStore({
      storage: deps.storage,
      setI18nLanguage: deps.setI18nLanguage,
      setRtl: deps.setRtl,
      initial: deps.initialLocale ?? 'he',
    });
    this.theme = new ThemeStore({ storage: deps.storage });
  }

  async hydrate(): Promise<void> {
    await Promise.allSettled([
      this.theme.hydrate(),
      this.locale.hydrate(),
      this.auth.hydrate(),
    ]);
  }
}
