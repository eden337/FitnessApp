import { makeAutoObservable, runInAction } from 'mobx';
import { STORAGE_KEYS, type SecureStorage } from '../services/secureStorage';
import type { ThemePreference } from '../theme';

export class ThemeStore {
  preference: ThemePreference = 'system';
  hydrated = false;
  private readonly storage: SecureStorage;

  constructor({ storage }: { storage: SecureStorage }) {
    this.storage = storage;
    makeAutoObservable<this, 'storage'>(this, { storage: false });
  }

  async hydrate(): Promise<void> {
    try {
      const stored = await this.storage.get(STORAGE_KEYS.theme);
      runInAction(() => {
        if (stored === 'system' || stored === 'light' || stored === 'dark') {
          this.preference = stored;
        }
      });
    } finally {
      runInAction(() => {
        this.hydrated = true;
      });
    }
  }

  async setPreference(preference: ThemePreference): Promise<void> {
    runInAction(() => {
      this.preference = preference;
    });
    await this.storage.set(STORAGE_KEYS.theme, preference);
  }
}
