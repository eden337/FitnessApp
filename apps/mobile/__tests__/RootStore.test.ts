import type { AxiosInstance } from 'axios';
import { RootStore } from '../src/stores/RootStore';
import { createInMemoryStorage, STORAGE_KEYS } from '../src/services/secureStorage';

describe('RootStore hydration', () => {
  it('hydrates auth, locale, and theme together', async () => {
    const storage = createInMemoryStorage({
      [STORAGE_KEYS.locale]: 'en',
      [STORAGE_KEYS.theme]: 'dark',
    });
    const setI18nLanguage = jest.fn();
    const setRtl = jest.fn();
    const store = new RootStore({
      baseURL: 'http://x',
      storage,
      setI18nLanguage,
      setRtl,
      api: { post: jest.fn() } as unknown as AxiosInstance,
    });

    await store.hydrate();

    expect(store.auth.status).toBe('unauthenticated');
    expect(store.locale.locale).toBe('en');
    expect(store.theme.preference).toBe('dark');
    expect(store.theme.hydrated).toBe(true);
    expect(setI18nLanguage).toHaveBeenCalledWith('en');
    expect(setRtl).toHaveBeenCalledWith(false);
  });
});
