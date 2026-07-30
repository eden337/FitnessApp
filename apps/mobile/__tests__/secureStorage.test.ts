import { createInMemoryStorage, createWebStorage } from '../src/services/secureStorage';

describe('createInMemoryStorage', () => {
  it('round-trips set/get/remove', async () => {
    const s = createInMemoryStorage();
    expect(await s.get('k')).toBeNull();
    await s.set('k', 'v');
    expect(await s.get('k')).toBe('v');
    await s.remove('k');
    expect(await s.get('k')).toBeNull();
  });

  it('seeds with an initial map', async () => {
    const s = createInMemoryStorage({ a: '1', b: '2' });
    expect(await s.get('a')).toBe('1');
    expect(await s.get('b')).toBe('2');
  });
});

describe('createWebStorage', () => {
  it('persists through the supplied browser storage backend', async () => {
    const values = new Map<string, string>();
    const backend = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    } as unknown as Storage;
    const storage = createWebStorage(backend);

    await storage.set('theme', 'dark');
    expect(await storage.get('theme')).toBe('dark');
    await storage.remove('theme');
    expect(await storage.get('theme')).toBeNull();
  });
});
