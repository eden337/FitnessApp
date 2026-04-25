import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { I18nProvider, useTranslation } from '../i18n/I18nProvider';
import type { Locale } from '../i18n/resources';
import { colors, spacing, typography } from '../theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.sm },
  tagline: { ...typography.body, color: colors.muted, textAlign: 'center' },
});

const Home: React.FC = () => {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container} testID="home-screen">
      <StatusBar style="auto" />
      <View style={styles.inner}>
        <Text style={styles.title}>{t('common:appName')}</Text>
        <Text style={styles.tagline}>{t('common:tagline')}</Text>
      </View>
    </SafeAreaView>
  );
};

export type AppProps = { locale?: Locale };

export const App: React.FC<AppProps> = ({ locale = 'he' }) => (
  <I18nProvider locale={locale}>
    <Home />
  </I18nProvider>
);
