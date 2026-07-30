import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, I18nManager, SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/rubik';
import { I18nProvider, createI18n } from '../i18n/I18nProvider';
import type { Locale } from '../i18n/resources';
import { RootStore } from '../stores/RootStore';
import { StoresProvider } from '../stores/StoresContext';
import type { SecureStorage } from '../services/secureStorage';
import { createNativeSecureStorage } from '../services/nativeSecureStorage';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
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
  const [bootstrapped, setBootstrapped] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
    Rubik_800ExtraBold,
  });
  // i18n instance is per-mount; locale toggle calls `instance.changeLanguage`.
  const i18n = useMemo(() => createI18n(locale), [locale]);

  const rootStore = useMemo(() => {
    if (store) return store;
    const sec = storage ?? createNativeSecureStorage();
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

  useEffect(() => {
    let mounted = true;
    void rootStore.hydrate().finally(() => {
      if (mounted) setBootstrapped(true);
    });
    return () => {
      mounted = false;
    };
  }, [rootStore]);

  if (process.env.NODE_ENV !== 'test' && !fontsLoaded && !fontError) return null;

  return (
    <StoresProvider store={rootStore}>
      <I18nProvider instance={i18n}>
        <ThemeProvider>
          <ThemedApp bootstrapped={bootstrapped} />
        </ThemeProvider>
      </I18nProvider>
    </StoresProvider>
  );
};

const ThemedApp: React.FC<{ bootstrapped: boolean }> = ({ bootstrapped }) => {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.canvas }}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      {bootstrapped ? (
        <RootNavigator />
      ) : (
        <View style={styles.center} testID="app-bootstrap-loading">
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
