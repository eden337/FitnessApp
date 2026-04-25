import { createInMemoryStorage } from '../src/services/secureStorage';

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
