import React from 'react';
import { observer } from 'mobx-react-lite';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BilingualText } from '@fitnessapp/shared';
import { AppIcon } from '../components/AppIcon';
import { Button } from '../components/Button';
import { MissionHero } from '../components/MissionHero';
import { PartnerCard } from '../components/PartnerCard';
import { ProgressRing } from '../components/ProgressRing';
import { useTranslation } from '../i18n/I18nProvider';
import { useStores } from '../stores/StoresContext';
import type { AppTheme } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

export type HomeScreenProps = {
  onPressPartner?: () => void;
  onPressProgram?: () => void;
  onPressProgress?: () => void;
  onPressProfile?: () => void;
  onPressSettings?: () => void;
};

export const HomeScreen: React.FC<HomeScreenProps> = observer(
  ({ onPressPartner, onPressProgram, onPressProgress, onPressProfile, onPressSettings }) => {
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
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <AppIcon name="heart" color={theme.colors.onPrimary} size={22} />
            </View>
            <View>
              <Text style={styles.brandOverline}>{t('common:home.brandOverline')}</Text>
              <Text style={styles.brand}>{t('common:appName')}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {onPressProfile ? (
              <HomeIconButton
                accessibilityLabel={t('profile:private.title')}
                icon="profile"
                onPress={onPressProfile}
                testID="home-profile"
              />
            ) : null}
            {onPressSettings ? (
              <HomeIconButton
                accessibilityLabel={t('common:settings.title')}
                icon="settings"
                onPress={onPressSettings}
                testID="home-settings"
              />
            ) : null}
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

      </ScrollView>
    );
  },
);

const HomeIconButton: React.FC<{
  accessibilityLabel: string;
  icon: 'profile' | 'settings';
  onPress: () => void;
  testID: string;
}> = ({ accessibilityLabel, icon, onPress, testID }) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.headerButton, pressed ? styles.pressed : null]}
      testID={testID}
    >
      <AppIcon name={icon} color={theme.colors.text} size={24} />
    </Pressable>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: theme.colors.canvas, padding: theme.spacing.lg, gap: theme.spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  headerActions: { flexDirection: 'row', gap: theme.spacing.sm },
  headerButton: { width: 48, height: 48, borderRadius: theme.radii.md, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.76 },
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
  actions: { gap: theme.spacing.md },
});
