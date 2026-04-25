import { LocaleStore } from '../src/stores/LocaleStore';
import { createInMemoryStorage, STORAGE_KEYS } from '../src/services/secureStorage';

const buildLocaleStore = (initial?: 'he' | 'en', stored?: string) => {
  const seed = stored ? { [STORAGE_KEYS.locale]: stored } : {};
  const storage = createInMemoryStorage(seed);
  const setI18nLanguage = jest.fn(async () => undefined);
  const setRtl = jest.fn();
  const opts: ConstructorParameters<typeof LocaleStore>[0] = {
    storage,
    setI18nLanguage,
    setRtl,
  };
  if (initial !== undefined) opts.initial = initial;
  const store = new LocaleStore(opts);
  return { store, storage, setI18nLanguage, setRtl };
};

describe('LocaleStore', () => {
  it('defaults to Hebrew with RTL true', () => {
    const { store } = buildLocaleStore();
    expect(store.locale).toBe('he');
    expect(store.isRtl).toBe(true);
  });

  it('hydrate: applies a stored locale and toggles RTL accordingly', async () => {
    const { store, setRtl, setI18nLanguage } = buildLocaleStore('he', 'en');
    await store.hydrate();
    expect(store.locale).toBe('en');
    expect(store.isRtl).toBe(false);
    expect(setRtl).toHaveBeenCalledWith(false);
    expect(setI18nLanguage).toHaveBeenCalledWith('en');
  });

  it('hydrate: ignores garbage stored values and applies the initial', async () => {
    const { store, setRtl } = buildLocaleStore('he', 'klingon');
    await store.hydrate();
    expect(store.locale).toBe('he');
    expect(setRtl).toHaveBeenCalledWith(true);
  });

  it('set: persists by default and updates RTL + i18n language', async () => {
    const { store, storage, setRtl, setI18nLanguage } = buildLocaleStore();
    await store.set('en');
    expect(store.locale).toBe('en');
    expect(setRtl).toHaveBeenLastCalledWith(false);
    expect(setI18nLanguage).toHaveBeenLastCalledWith('en');
    expect(await storage.get(STORAGE_KEYS.locale)).toBe('en');
  });

  it('set: persist=false skips storage write (used on hydrate)', async () => {
    const { store, storage } = buildLocaleStore();
    await store.set('en', { persist: false });
    expect(await storage.get(STORAGE_KEYS.locale)).toBeNull();
  });

  it('toggle flips between he and en', async () => {
    const { store } = buildLocaleStore();
    expect(store.locale).toBe('he');
    await store.toggle();
    expect(store.locale).toBe('en');
    await store.toggle();
    expect(store.locale).toBe('he');
  });
});
