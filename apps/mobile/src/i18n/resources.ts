import heCommon from './he/common.json';
import enCommon from './en/common.json';

export type Locale = 'he' | 'en';

export const resources = {
  he: { common: heCommon },
  en: { common: enCommon },
} as const;

export const supportedLocales: readonly Locale[] = ['he', 'en'];
