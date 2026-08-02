import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BilingualText, ProgramWeekNumber } from '@fitnessapp/shared';
import { Button } from '../../components/Button';
import { CelebrationBanner } from '../../components/CelebrationBanner';
import { MissionHero } from '../../components/MissionHero';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SegmentedPicker } from '../../components/SegmentedPicker';
import { useTranslation } from '../../i18n/I18nProvider';
import { useStores } from '../../stores/StoresContext';
import type { AppTheme } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

export type TodayScreenProps = {
  onClose?: () => void;
  onOpenLists?: () => void;
};

const weekOptions = Array.from({ length: 13 }, (_, index) => {
  const week = String(index + 1);
  return { value: week, label: week };
});

export const TodayScreen: React.FC<TodayScreenProps> = observer(
  ({ onClose, onOpenLists }) => {
    const { program, locale } = useStores();
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = createStyles(theme);
    const [selectedWeek, setSelectedWeek] = useState('1');
    const current = program.current;
    const text = (value: BilingualText | null): string =>
      value?.[locale.locale] ?? '';

    if (!current) {
      return (
        <View style={styles.center} testID="program-today-screen">
          {onClose ? <ScreenHeader title={t('program:today.title')} onBack={onClose} /> : null}
          {program.status === 'loading' ? <ActivityIndicator color={theme.colors.primary} /> : null}
          <Text style={styles.body}>
            {t(
              program.status === 'loading'
                ? 'program:today.loading'
                : 'program:today.unavailable',
            )}
          </Text>
        </View>
      );
    }

    if (current.status === 'not_started') {
      return (
        <ScrollView contentContainerStyle={styles.scroll} testID="program-today-screen">
          {onClose ? <ScreenHeader title={t('program:today.title')} onBack={onClose} /> : null}
          <Text style={styles.title}>{t('program:start.title')}</Text>
          <Text style={styles.body}>{t('program:start.description')}</Text>
          <SegmentedPicker
            label={t('program:start.weekPicker')}
            options={weekOptions}
            value={selectedWeek}
            onChange={setSelectedWeek}
            testID="program-week-picker"
          />
          <Button
            testID="program-start"
            label={t('program:start.action', { week: selectedWeek })}
            loading={program.status === 'loading'}
            onPress={async () => {
              await program.start(Number(selectedWeek) as ProgramWeekNumber);
            }}
          />
          {program.errorMessage ? (
            <Text style={styles.error}>{errorText(program.errorMessage, t)}</Text>
          ) : null}
        </ScrollView>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scroll} testID="program-today-screen">
        {onClose ? <ScreenHeader title={t('program:today.title')} onBack={onClose} /> : null}
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.overline}>
              {t('program:today.title')}
            </Text>
            <Text style={styles.title}>{text(current.week.title)}</Text>
          </View>
          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeNumber}>{current.scheduledWeekNumber}</Text>
            <Text style={styles.weekBadgeLabel}>{t('program:today.week')}</Text>
          </View>
        </View>
        {current.isFallback ? (
          <Text style={styles.fallback} testID="program-fallback">
            {t('program:today.fallback')}
          </Text>
        ) : null}
        {current.status === 'completed' ? (
          <CelebrationBanner message={t('program:today.completed')} />
        ) : null}
        <MissionHero
          testID="today-mission-hero"
          eyebrow={t('program:today.focus')}
          title={t('program:today.mission')}
          body={text(current.week.mission)}
        />
        {program.listsStatus === 'error' ? (
          <View style={styles.warning} testID="program-lists-refresh-error">
            <Text style={styles.body}>{t('program:listRefresh.error')}</Text>
            <Button
              testID="program-lists-refresh-retry"
              label={t('program:listRefresh.retry')}
              onPress={async () => {
                await program.refreshLists();
              }}
              variant="secondary"
            />
          </View>
        ) : null}
        {current.week.rationale ? (
          <Section
            title={t('program:today.rationale')}
            body={text(current.week.rationale)}
          />
        ) : null}
        {current.week.notes ? (
          <Section title={t('program:today.notes')} body={text(current.week.notes)} />
        ) : null}
        <View style={styles.taskHeading}>
          <Text style={styles.sectionTitle}>{t('program:today.tasks')}</Text>
          <Text style={styles.taskCount}>
            {t('program:today.taskCount', { count: current.week.tasks.length })}
          </Text>
        </View>
        {current.week.tasks.map((task, index) => (
          <View key={task.id} style={styles.task} testID={`today-task-${index}`}>
            <View style={styles.taskNumber}>
              <Text style={styles.taskNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.taskCopy}>
              <Text
                style={[
                  styles.taskKind,
                  task.kind === 'optional' ? styles.taskKindOptional : null,
                ]}
              >
                {t(`program:today.${task.kind}`)}
              </Text>
              <Text style={styles.taskTitle}>{text(task.title)}</Text>
              {task.description ? (
                <Text style={styles.taskBody}>{text(task.description)}</Text>
              ) : null}
            </View>
          </View>
        ))}
        {onOpenLists ? (
          <Button
            testID="program-open-lists"
            label={t('program:lists.open')}
            onPress={onOpenLists}
            variant="secondary"
          />
        ) : null}
      </ScrollView>
    );
  },
);

const Section: React.FC<{ title: string; body: string }> = ({ title, body }) => {
  const styles = createStyles(useTheme());
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
};

const errorText = (code: string, t: (key: string) => string): string => {
  const known = ['already_started', 'missing_metrics'];
  return t(known.includes(code) ? `program:errors.${code}` : 'program:errors.generic');
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: theme.colors.canvas, padding: theme.spacing.lg, gap: theme.spacing.md },
  center: { flex: 1, backgroundColor: theme.colors.canvas, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md, padding: theme.spacing.lg },
  title: { ...theme.typography.h1, color: theme.colors.text },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overline: { ...theme.typography.label, color: theme.colors.progress },
  weekBadge: { width: 58, height: 58, borderRadius: theme.radii.lg, backgroundColor: theme.colors.reward, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.foodPalette.outline },
  weekBadgeNumber: { ...theme.typography.h2, color: theme.foodPalette.outline, lineHeight: 24 },
  weekBadgeLabel: { ...theme.typography.caption, color: theme.foodPalette.outline },
  sectionTitle: { ...theme.typography.h2, color: theme.colors.text },
  body: { ...theme.typography.body, color: theme.colors.text },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, padding: theme.spacing.lg, gap: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadow },
  taskHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.sm },
  taskCount: { ...theme.typography.label, color: theme.colors.textMuted },
  task: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, padding: theme.spacing.md, gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center' },
  taskNumber: { width: 42, height: 42, borderRadius: theme.radii.md, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  taskNumberText: { ...theme.typography.title, color: theme.colors.progress },
  taskCopy: { flex: 1, gap: theme.spacing.xs },
  taskKind: { ...theme.typography.caption, color: theme.colors.onSecondary, fontWeight: '700', backgroundColor: theme.colors.secondary, alignSelf: 'flex-start', paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xxs, borderRadius: theme.radii.pill },
  taskKindOptional: { color: theme.colors.onPrimary, backgroundColor: theme.colors.primary },
  taskTitle: { ...theme.typography.body, color: theme.colors.text, fontWeight: '700' as const },
  taskBody: { ...theme.typography.caption, color: theme.colors.textMuted },
  fallback: { ...theme.typography.body, color: theme.colors.onPrimary, backgroundColor: theme.colors.primary, borderRadius: theme.radii.md, padding: theme.spacing.md },
  error: { ...theme.typography.body, color: theme.colors.danger },
  warning: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.lg, padding: theme.spacing.md, gap: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.reward },
});
