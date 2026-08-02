import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SharedActivityKind } from '@fitnessapp/shared';
import {
  ActivityKindPicker,
  activityChoice,
} from '../../components/ActivityKindPicker';
import { Button } from '../../components/Button';
import { CelebrationBanner } from '../../components/CelebrationBanner';
import { ScreenHeader } from '../../components/ScreenHeader';
import { TextField } from '../../components/TextField';
import { useTranslation } from '../../i18n/I18nProvider';
import { useStores } from '../../stores/StoresContext';
import type { AppTheme } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

export const ActivityScreen: React.FC<{ onBack: () => void }> = observer(({ onBack }) => {
  const { activity, locale } = useStores();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [selected, setSelected] = useState<SharedActivityKind | null>(null);
  const [note, setNote] = useState('');
  const [celebrating, setCelebrating] = useState(false);

  const share = async (): Promise<void> => {
    if (!selected) return;
    const trimmed = note.trim();
    const shared = await activity.share({
      kind: selected,
      ...(trimmed ? { note: trimmed } : {}),
    });
    if (shared) {
      setSelected(null);
      setNote('');
      setCelebrating(true);
    }
  };

  const formatDate = (value: string): string =>
    new Date(value).toLocaleDateString(locale.locale === 'he' ? 'he-IL' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID="activity-screen">
      <ScreenHeader title={t('activity:title')} onBack={onBack} />
      <Text style={styles.subtitle}>{t('activity:subtitle')}</Text>
      {celebrating ? <CelebrationBanner message={t('activity:success')} /> : null}

      <View style={styles.composer}>
        <Text style={styles.sectionTitle}>{t('activity:choose')}</Text>
        <ActivityKindPicker
          selected={selected}
          onSelect={(kind) => {
            setSelected(kind);
            setCelebrating(false);
          }}
        />
        <TextField
          label={t('activity:note.label')}
          placeholder={t('activity:note.placeholder')}
          maxLength={160}
          onChangeText={setNote}
          testID="activity-note"
          value={note}
        />
        {activity.errorMessage && activity.status !== 'error' ? (
          <Text style={styles.error}>{t('activity:errors.share')}</Text>
        ) : null}
        <Button
          disabled={!selected}
          label={t('activity:actions.share')}
          loading={activity.posting}
          onPress={share}
          testID="activity-share"
        />
      </View>

      <Text style={styles.sectionTitle}>{t('activity:feed.title')}</Text>
      {activity.status === 'loading' ? (
        <View style={styles.loading} testID="activity-loading">
          <ActivityIndicator color={theme.colors.progress} />
          <Text style={styles.empty}>{t('activity:feed.loading')}</Text>
        </View>
      ) : activity.status === 'error' ? (
        <View style={styles.errorCard}>
          <Text style={styles.error}>{t('activity:errors.load')}</Text>
          <Button
            label={t('activity:actions.retry')}
            onPress={() => activity.fetch()}
            variant="secondary"
            testID="activity-retry"
          />
        </View>
      ) : activity.activities.length === 0 ? (
        <Text style={styles.empty}>{t('activity:feed.empty')}</Text>
      ) : (
        activity.activities.map((item) => {
          const choice = activityChoice(item.kind);
          return (
            <View key={item.id} style={styles.feedCard}>
              <View
                style={[
                  styles.feedIcon,
                  { backgroundColor: theme.colors.foodTiles[choice.color] },
                ]}
              >
                <Text style={styles.feedEmoji}>{choice.emoji}</Text>
              </View>
              <View style={styles.feedCopy}>
                <View style={styles.feedHeading}>
                  <Text style={styles.actor}>{item.actor.displayName}</Text>
                  <Text style={styles.date}>
                    {t('activity:feed.date', { date: formatDate(item.createdAt) })}
                  </Text>
                </View>
                <Text style={styles.kind}>{t(`activity:kinds.${item.kind}`)}</Text>
                {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
});

const createStyles = (theme: AppTheme) => StyleSheet.create({
  actor: { ...theme.typography.label, color: theme.colors.text, flexShrink: 1 },
  composer: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    ...theme.shadow,
  },
  date: { ...theme.typography.caption, color: theme.colors.textMuted },
  empty: { ...theme.typography.body, color: theme.colors.textMuted },
  error: { ...theme.typography.caption, color: theme.colors.danger },
  errorCard: { gap: theme.spacing.md },
  feedCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  feedCopy: { flex: 1, gap: theme.spacing.xxs },
  feedEmoji: { fontSize: 26 },
  feedHeading: { flexDirection: 'row', justifyContent: 'space-between' },
  feedIcon: {
    alignItems: 'center',
    borderRadius: theme.radii.md,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  kind: { ...theme.typography.body, color: theme.colors.progress, fontWeight: '700' as const },
  loading: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm },
  note: { ...theme.typography.caption, color: theme.colors.textMuted },
  scroll: {
    backgroundColor: theme.colors.canvas,
    flexGrow: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sectionTitle: { ...theme.typography.h2, color: theme.colors.text },
  subtitle: { ...theme.typography.body, color: theme.colors.textMuted },
});
