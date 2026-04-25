import { resources, supportedLocales } from '../src/i18n/resources';

describe('i18n resources', () => {
  it('declares both supported locales', () => {
    expect(supportedLocales).toEqual(expect.arrayContaining(['he', 'en']));
  });

  it('has the same key set across locales so no locale falls behind', () => {
    const keys = (obj: Record<string, unknown>, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        typeof v === 'object' && v !== null
          ? keys(v as Record<string, unknown>, prefix ? `${prefix}.${k}` : k)
          : [prefix ? `${prefix}.${k}` : k],
      );

    for (const ns of Object.keys(resources.he)) {
      const heKeys = keys(resources.he[ns as keyof typeof resources.he]).sort();
      const enKeys = keys(resources.en[ns as keyof typeof resources.en]).sort();
      expect(enKeys).toEqual(heKeys);
    }
  });
});
