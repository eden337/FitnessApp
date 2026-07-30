import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useTranslation } from '../../i18n/I18nProvider';
import { useStores } from '../../stores/StoresContext';
import type { AppTheme } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

export const ProfileScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { profile } = useStores();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const metrics = profile.metrics;
  const derived = profile.derived;

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID="profile-screen">
      <ScreenHeader title={t('profile:private.title')} onBack={onBack} />
      <Text style={styles.body}>{t('profile:private.description')}</Text>
      {metrics && derived ? (
        <View style={styles.grid}>
          <PrivateMetric
            label={t('profile:summary.weight')}
            value={`${metrics.currentWeightKg} ${t('profile:summary.kg')}`}
          />
          <PrivateMetric label={t('profile:summary.bmi')} value={String(derived.bmi)} />
          <PrivateMetric
            label={t('profile:summary.ageYears')}
            value={`${derived.ageYears} ${t('profile:summary.years')}`}
          />
        </View>
      ) : null}
      <Text style={styles.privacy}>{t('profile:private.privacy')}</Text>
    </ScrollView>
  );
};

const PrivateMetric: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const styles = createStyles(useTheme());
  return (
    <View style={styles.metric}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
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
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
    metric: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      flexGrow: 1,
      minWidth: '45%',
      padding: theme.spacing.lg,
      ...theme.shadow,
    },
    label: { ...theme.typography.label, color: theme.colors.textMuted },
    value: { ...theme.typography.h1, color: theme.colors.progress, marginTop: theme.spacing.xs },
    privacy: {
      ...theme.typography.caption,
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: theme.radii.md,
      color: theme.colors.text,
      padding: theme.spacing.md,
    },
  });
