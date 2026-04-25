import { makeAutoObservable, runInAction } from 'mobx';
import type { Locale } from '@fitnessapp/shared';
import { STORAGE_KEYS, type SecureStorage } from '../services/secureStorage';

export type LocaleStoreDeps = {
  storage: SecureStorage;
  /** Sets the active i18next language. */
  setI18nLanguage: (lang: Locale) => Promise<void> | void;
  /** Toggles RN's RTL flag. Pure function; tests inject a no-op. */
  setRtl: (rtl: boolean) => void;
  initial?: Locale;
};

/**
 * Owns the current UI locale. Persists user preference and toggles RTL for
 * Hebrew. The store does NOT trigger an app reload; the caller decides
 * whether to call `Updates.reloadAsync()` (production) or just re-render
 * (tests).
 */
export class LocaleStore {
  locale: Locale;
  private readonly storage: SecureStorage;
  private readonly setI18nLanguage: (lang: Locale) => Promise<void> | void;
  private readonly setRtl: (rtl: boolean) => void;

  constructor(deps: LocaleStoreDeps) {
    this.locale = deps.initial ?? 'he';
    this.storage = deps.storage;
    this.setI18nLanguage = deps.setI18nLanguage;
    this.setRtl = deps.setRtl;
    makeAutoObservable<this, 'storage' | 'setI18nLanguage' | 'setRtl'>(this, {
      storage: false,
      setI18nLanguage: false,
      setRtl: false,
    });
  }

  async hydrate(): Promise<void> {
    const stored = (await this.storage.get(STORAGE_KEYS.locale)) as Locale | null;
    if (stored === 'he' || stored === 'en') {
      await this.set(stored, { persist: false });
    } else {
      // First-run: align RTL with the default locale.
      this.setRtl(this.locale === 'he');
      await this.setI18nLanguage(this.locale);
    }
  }

  get isRtl(): boolean {
    return this.locale === 'he';
  }

  async set(locale: Locale, opts: { persist?: boolean } = {}): Promise<void> {
    const persist = opts.persist ?? true;
    runInAction(() => {
      this.locale = locale;
    });
    this.setRtl(locale === 'he');
    await this.setI18nLanguage(locale);
    if (persist) await this.storage.set(STORAGE_KEYS.locale, locale);
  }

  async toggle(): Promise<void> {
    await this.set(this.locale === 'he' ? 'en' : 'he');
  }
}
