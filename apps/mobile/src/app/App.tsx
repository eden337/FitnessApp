import React, { useMemo } from 'react';
import { I18nManager, SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { I18nProvider, createI18n } from '../i18n/I18nProvider';
import type { Locale } from '../i18n/resources';
import { RootStore } from '../stores/RootStore';
import { StoresProvider } from '../stores/StoresContext';
import { createInMemoryStorage, type SecureStorage } from '../services/secureStorage';
import { createNativeSecureStorage } from '../services/nativeSecureStorage';
import { colors } from '../theme';
import { RootNavigator } from './RootNavigator';

export type AppProps = {
  /** Optional override for tests / Storybook. */
  store?: RootStore;
  /** Initial locale; tests pass 'en' to bypass the default 'he'. */
  locale?: Locale;
  /** Storage backend; tests pass `createInMemoryStorage()`. */
  storage?: SecureStorage;
};

const DEFAULT_BASE_URL = 'http://localhost:4000';

export const App: React.FC<AppProps> = ({ store, locale = 'he', storage }) => {
  // i18n instance is per-mount; locale toggle calls `instance.changeLanguage`.
  const i18n = useMemo(() => createI18n(locale), [locale]);

  const rootStore = useMemo(() => {
    if (store) return store;
    const sec = storage ?? (typeof globalThis !== 'undefined' && globalThis.process
      ? createInMemoryStorage()
      : createNativeSecureStorage());
    return new RootStore({
      baseURL: DEFAULT_BASE_URL,
      storage: sec,
      setI18nLanguage: async (lang) => {
        await i18n.changeLanguage(lang);
      },
      setRtl: (rtl) => I18nManager.forceRTL(rtl),
      initialLocale: locale,
    });
  }, [store, storage, locale, i18n]);

  return (
    <StoresProvider store={rootStore}>
      <I18nProvider locale={locale}>
        <SafeAreaView style={styles.container}>
          <StatusBar style="auto" />
          <RootNavigator />
        </SafeAreaView>
      </I18nProvider>
    </StoresProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
