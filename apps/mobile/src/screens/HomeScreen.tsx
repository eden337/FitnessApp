import React from 'react';
import { observer } from 'mobx-react-lite';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { LocaleToggle } from '../components/LocaleToggle';
import { useTranslation } from '../i18n/I18nProvider';
import { useStores } from '../stores/StoresContext';
import { colors, radii, spacing, typography } from '../theme';

export const HomeScreen: React.FC = observer(() => {
  const { auth, profile } = useStores();
  const { t } = useTranslation();
  const name = auth.user?.displayName ?? '';
  const d = profile.derived;
  const m = profile.metrics;

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID="home-screen">
      <Text style={styles.greeting}>{t('common:home.greeting', { name })}</Text>

      {d && m ? (
        <View style={styles.card}>
          <SummaryRow label={t('profile:summary.target')} value={`${d.targetKcal} ${t('profile:summary.kcal')}`} />
          <SummaryRow label={t('profile:summary.tdee')} value={`${d.tdeeKcal} ${t('profile:summary.kcal')}`} />
          <SummaryRow label={t('profile:summary.bmr')} value={`${d.bmrKcal} ${t('profile:summary.kcal')}`} />
          <SummaryRow label={t('profile:summary.weight')} value={`${m.currentWeightKg} ${t('profile:summary.kg')}`} />
          <SummaryRow label={t('profile:summary.ageYears')} value={`${d.ageYears} ${t('profile:summary.years')}`} />
        </View>
      ) : (
        <Text style={styles.empty} testID="home-empty">
          {t('common:home.needsSetup')}
        </Text>
      )}

      <View style={styles.actions}>
        <LocaleToggle />
        <Button
          testID="home-signout"
          variant="secondary"
          label={t('common:actions.signOut')}
          onPress={() => auth.signOut()}
        />
      </View>
    </ScrollView>
  );
});

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.lg },
  greeting: { ...typography.h1, color: colors.text, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  empty: { ...typography.body, color: colors.muted, marginVertical: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { ...typography.body, color: colors.muted },
  rowValue: { ...typography.body, color: colors.text, fontWeight: '600' as const },
  actions: { marginTop: spacing.xl, gap: spacing.md },
});
