import heCommon from './he/common.json';
import heAuth from './he/auth.json';
import heProfile from './he/profile.json';
import heCouple from './he/couple.json';
import enCommon from './en/common.json';
import enAuth from './en/auth.json';
import enProfile from './en/profile.json';
import enCouple from './en/couple.json';

export type Locale = 'he' | 'en';

export const resources = {
  he: { common: heCommon, auth: heAuth, profile: heProfile, couple: heCouple },
  en: { common: enCommon, auth: enAuth, profile: enProfile, couple: enCouple },
} as const;

export const supportedLocales: readonly Locale[] = ['he', 'en'];
export const namespaces: readonly string[] = ['common', 'auth', 'profile', 'couple'];
