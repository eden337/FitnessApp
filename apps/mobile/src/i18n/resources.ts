import heCommon from './he/common.json';
import heAuth from './he/auth.json';
import heProfile from './he/profile.json';
import heCouple from './he/couple.json';
import heProgram from './he/program.json';
import heProgress from './he/progress.json';
import enCommon from './en/common.json';
import enAuth from './en/auth.json';
import enProfile from './en/profile.json';
import enCouple from './en/couple.json';
import enProgram from './en/program.json';
import enProgress from './en/progress.json';

export type Locale = 'he' | 'en';

export const resources = {
  he: {
    common: heCommon,
    auth: heAuth,
    profile: heProfile,
    couple: heCouple,
    program: heProgram,
    progress: heProgress,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    profile: enProfile,
    couple: enCouple,
    program: enProgram,
    progress: enProgress,
  },
} as const;

export const supportedLocales: readonly Locale[] = ['he', 'en'];
export const namespaces: readonly string[] = [
  'common',
  'auth',
  'profile',
  'couple',
  'program',
  'progress',
];
