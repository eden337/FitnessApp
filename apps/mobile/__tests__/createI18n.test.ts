import { createI18n } from '../src/i18n/I18nProvider';

describe('createI18n', () => {
  it('defaults to Hebrew when called with no arguments', () => {
    const i18n = createI18n();
    expect(i18n.language).toBe('he');
    expect(i18n.t('common:appName')).toBe('כושר לזוגות');
  });

  it('initializes with English when explicitly requested', () => {
    const i18n = createI18n('en');
    expect(i18n.language).toBe('en');
    expect(i18n.t('common:appName')).toBe('Couple Fit');
  });

  it('produces independent instances that do not share state', () => {
    const a = createI18n('he');
    const b = createI18n('en');
    expect(a.language).toBe('he');
    expect(b.language).toBe('en');
  });
});
