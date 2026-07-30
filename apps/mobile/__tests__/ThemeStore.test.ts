import { createInMemoryStorage, STORAGE_KEYS } from '../src/services/secureStorage';
import { ThemeStore } from '../src/stores/ThemeStore';

describe('ThemeStore', () => {
  it('defaults to following the system theme', () => {
    const store = new ThemeStore({ storage: createInMemoryStorage() });
    expect(store.preference).toBe('system');
  });

  it('hydrates a valid saved preference', async () => {
    const storage = createInMemoryStorage({ [STORAGE_KEYS.theme]: 'dark' });
    const store = new ThemeStore({ storage });

    await store.hydrate();

    expect(store.preference).toBe('dark');
    expect(store.hydrated).toBe(true);
  });

  it('ignores an invalid saved preference', async () => {
    const storage = createInMemoryStorage({ [STORAGE_KEYS.theme]: 'neon' });
    const store = new ThemeStore({ storage });

    await store.hydrate();

    expect(store.preference).toBe('system');
    expect(store.hydrated).toBe(true);
  });

  it('persists explicit and system preferences', async () => {
    const storage = createInMemoryStorage();
    const store = new ThemeStore({ storage });

    await store.setPreference('light');
    expect(await storage.get(STORAGE_KEYS.theme)).toBe('light');

    await store.setPreference('system');
    expect(await storage.get(STORAGE_KEYS.theme)).toBe('system');
  });
});
