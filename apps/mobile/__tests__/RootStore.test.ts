import { RootStore } from '../src/stores/RootStore';
import { createInMemoryStorage } from '../src/services/secureStorage';

describe('RootStore', () => {
  it('builds a default api client when none is injected', () => {
    const store = new RootStore({
      baseURL: 'http://localhost:4000',
      storage: createInMemoryStorage(),
      setI18nLanguage: jest.fn(),
      setRtl: jest.fn(),
    });
    expect(store.api).toBeDefined();
    expect(typeof store.api.request).toBe('function');
    // The default api was wired so that getTokens / setTokens / onAuthFailure
    // delegate to the AuthStore. Set tokens through the store and verify
    // they're observable through the AuthStore accessor.
    store.auth.setTokens({ accessToken: 'a', refreshToken: 'r' });
    expect(store.auth.getTokens()).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('respects an injected api instance', () => {
    const fake = { request: jest.fn() } as unknown as import('axios').AxiosInstance;
    const store = new RootStore({
      baseURL: 'http://x',
      storage: createInMemoryStorage(),
      setI18nLanguage: jest.fn(),
      setRtl: jest.fn(),
      api: fake,
    });
    expect(store.api).toBe(fake);
  });

  it('seeds the LocaleStore with the requested initial locale', () => {
    const store = new RootStore({
      baseURL: 'http://x',
      storage: createInMemoryStorage(),
      setI18nLanguage: jest.fn(),
      setRtl: jest.fn(),
      initialLocale: 'en',
    });
    expect(store.locale.locale).toBe('en');
  });
});
