import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../components/AppIcon';
import { Button } from '../components/Button';
import { LocaleToggle } from '../components/LocaleToggle';
import { ScreenHeader } from '../components/ScreenHeader';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTranslation } from '../i18n/I18nProvider';
import { useStores } from '../stores/StoresContext';
import type { AppTheme } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

export const SettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { auth } = useStores();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID="settings-screen">
      <ScreenHeader title={t('common:settings.title')} onBack={onBack} />
      <Text style={styles.body}>{t('common:settings.description')}</Text>
      <View style={styles.card}>
        <LocaleToggle />
        <View style={styles.divider} />
        <ThemeToggle />
      </View>
      <Button
        testID="settings-signout"
        variant="secondary"
        label={t('common:actions.signOut')}
        onPress={() => auth.signOut()}
        leadingIcon={<AppIcon name="signOut" color={theme.colors.text} />}
      />
    </ScrollView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    scroll: {
      backgroundColor: theme.colors.canvas,
      flexGrow: 1,
      gap: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    body: { ...theme.typography.body, color: theme.colors.textMuted },
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      gap: theme.spacing.lg,
      padding: theme.spacing.lg,
      ...theme.shadow,
    },
    divider: { backgroundColor: theme.colors.border, height: 1 },
  });
