import heCommon from './he/common.json';
import heAuth from './he/auth.json';
import heProfile from './he/profile.json';
import enCommon from './en/common.json';
import enAuth from './en/auth.json';
import enProfile from './en/profile.json';

export type Locale = 'he' | 'en';

export const resources = {
  he: { common: heCommon, auth: heAuth, profile: heProfile },
  en: { common: enCommon, auth: enAuth, profile: enProfile },
} as const;

export const supportedLocales: readonly Locale[] = ['he', 'en'];
export const namespaces: readonly string[] = ['common', 'auth', 'profile'];
