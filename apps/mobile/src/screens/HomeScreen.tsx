import React from 'react';
import { observer } from 'mobx-react-lite';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BilingualText } from '@fitnessapp/shared';
import { AppIcon } from '../components/AppIcon';
import { Button } from '../components/Button';
import { LocaleToggle } from '../components/LocaleToggle';
import { MissionHero } from '../components/MissionHero';
import { PartnerCard } from '../components/PartnerCard';
import { ProgressRing } from '../components/ProgressRing';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTranslation } from '../i18n/I18nProvider';
import { useStores } from '../stores/StoresContext';
import type { AppTheme } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

export type HomeScreenProps = {
  onPressPartner?: () => void;
  onPressProgram?: () => void;
  onPressProgress?: () => void;
};

export const HomeScreen: React.FC<HomeScreenProps> = observer(
  ({ onPressPartner, onPressProgram, onPressProgress }) => {
    const { auth, profile, program, locale } = useStores();
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = createStyles(theme);
    const name = auth.user?.displayName ?? '';
    const d = profile.derived;
    const m = profile.metrics;
    const current = program.current;
    const week = current?.scheduledWeekNumber ?? 0;
    const progress = current?.status === 'completed' ? 100 : Math.round((week / 13) * 100);
    const localized = (value: BilingualText): string => value[locale.locale];

    return (
      <ScrollView contentContainerStyle={styles.scroll} testID="home-screen">
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <AppIcon name="heart" color={theme.colors.onPrimary} size={22} />
          </View>
          <View>
            <Text style={styles.brandOverline}>{t('common:home.brandOverline')}</Text>
            <Text style={styles.brand}>{t('common:appName')}</Text>
          </View>
        </View>

        <Text style={styles.greeting}>{t('common:home.greeting', { name })}</Text>
        <Text style={styles.eyebrow}>{t('common:home.encouragement')}</Text>

        {d && m ? (
          <View style={styles.momentumCard} testID="home-momentum-card">
            <ProgressRing
              progress={progress}
              label={
                week > 0
                  ? t('program:today.weekLabel', { week })
                  : t('common:home.ready')
              }
            />
            <View style={styles.momentumCopy}>
              <Text style={styles.cardEyebrow}>{t('common:home.momentum')}</Text>
              <Text style={styles.cardTitle}>{t('common:home.keepMoving')}</Text>
              <Text style={styles.cardBody}>{t('common:home.momentumBody')}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.empty} testID="home-empty">
            {t('common:home.needsSetup')}
          </Text>
        )}

        {current && current.status !== 'not_started' ? (
          <MissionHero
            eyebrow={t('common:home.todayMission')}
            title={localized(current.week.title)}
            body={localized(current.week.mission)}
          />
        ) : null}

        <PartnerCard {...(onPressPartner !== undefined && { onPress: onPressPartner })} />

        {d && m ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('common:home.snapshot')}</Text>
            <View style={styles.statGrid}>
              <StatTile
                accent={theme.colors.primary}
                label={t('profile:summary.target')}
                value={`${d.targetKcal} ${t('profile:summary.kcal')}`}
              />
              <StatTile
                accent={theme.colors.secondary}
                label={t('profile:summary.weight')}
                value={`${m.currentWeightKg} ${t('profile:summary.kg')}`}
              />
              <StatTile
                accent={theme.colors.progress}
                label={t('profile:summary.tdee')}
                value={`${d.tdeeKcal} ${t('profile:summary.kcal')}`}
              />
              <StatTile
                accent={theme.colors.reward}
                label={t('profile:summary.bmr')}
                value={`${d.bmrKcal} ${t('profile:summary.kcal')}`}
              />
              <StatTile
                accent={theme.colors.hydration}
                label={t('profile:summary.ageYears')}
                value={`${d.ageYears} ${t('profile:summary.years')}`}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          {onPressProgram ? (
            <Button
              testID="home-program"
              label={t('program:actions.open')}
              onPress={onPressProgram}
              leadingIcon={<AppIcon name="program" color={theme.colors.onPrimary} />}
            />
          ) : null}
          {onPressProgress ? (
            <Button
              testID="home-progress"
              label={t('progress:actions.open')}
              onPress={onPressProgress}
              variant="secondary"
              leadingIcon={<AppIcon name="progress" color={theme.colors.text} />}
            />
          ) : null}
        </View>

        <View style={styles.preferences}>
          <Text style={styles.sectionTitle}>{t('common:home.preferences')}</Text>
          <LocaleToggle />
          <ThemeToggle />
          <Button
            testID="home-signout"
            variant="text"
            label={t('common:actions.signOut')}
            onPress={() => auth.signOut()}
            leadingIcon={<AppIcon name="signOut" color={theme.colors.primary} />}
          />
        </View>
      </ScrollView>
    );
  },
);

const StatTile: React.FC<{ label: string; value: string; accent: string }> = ({
  label,
  value,
  accent,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.statTile}>
      <View style={[styles.statAccent, { backgroundColor: accent }]} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: theme.colors.canvas, padding: theme.spacing.lg, gap: theme.spacing.lg },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  brandIcon: { width: 42, height: 42, borderRadius: theme.radii.md, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandOverline: { ...theme.typography.caption, color: theme.colors.textMuted, letterSpacing: 1 },
  brand: { ...theme.typography.title, color: theme.colors.primary },
  greeting: { ...theme.typography.display, color: theme.colors.text, marginTop: theme.spacing.sm },
  eyebrow: { ...theme.typography.body, color: theme.colors.textMuted, marginTop: -theme.spacing.md },
  momentumCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.xl, padding: theme.spacing.lg, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadow },
  momentumCopy: { flex: 1, gap: theme.spacing.xs },
  cardEyebrow: { ...theme.typography.caption, color: theme.colors.progress, letterSpacing: 0.8 },
  cardTitle: { ...theme.typography.h2, color: theme.colors.text },
  cardBody: { ...theme.typography.caption, color: theme.colors.textMuted },
  empty: { ...theme.typography.body, color: theme.colors.textMuted, marginVertical: theme.spacing.lg },
  section: { gap: theme.spacing.md },
  sectionTitle: { ...theme.typography.h2, color: theme.colors.text },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  statTile: { minWidth: '47%', flexGrow: 1, backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  statAccent: { position: 'absolute', start: 0, top: 0, bottom: 0, width: 5 },
  statLabel: { ...theme.typography.caption, color: theme.colors.textMuted },
  statValue: { ...theme.typography.title, color: theme.colors.text, marginTop: theme.spacing.xs },
  actions: { gap: theme.spacing.md },
  preferences: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.lg, padding: theme.spacing.lg, gap: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
});
