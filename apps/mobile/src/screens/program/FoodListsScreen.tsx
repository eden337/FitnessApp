import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BilingualText } from '@fitnessapp/shared';
import { Button } from '../../components/Button';
import { AppIcon } from '../../components/AppIcon';
import { FoodVisual } from '../../components/FoodVisual';
import { SegmentedPicker } from '../../components/SegmentedPicker';
import { useTranslation } from '../../i18n/I18nProvider';
import { useStores } from '../../stores/StoresContext';
import type { AppTheme } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

export type FoodListsScreenProps = { onClose?: () => void };
type Scope = 'global' | 'current';

export const FoodListsScreen: React.FC<FoodListsScreenProps> = observer(({ onClose }) => {
  const { program, locale } = useStores();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [scope, setScope] = useState<Scope>('global');
  const text = (value: BilingualText | null): string => value?.[locale.locale] ?? '';
  const lists = program.lists.filter((list) =>
    scope === 'global' ? list.weekNumber === null : list.weekNumber !== null,
  );
  const choiceCount = lists.reduce((total, list) => total + list.items.length, 0);

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID="program-food-lists-screen">
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.overline}>{t('program:lists.eyebrow')}</Text>
          <Text style={styles.title}>{t('program:lists.title')}</Text>
        </View>
        <View style={styles.titleIcon}>
          <AppIcon name="sparkle" color={theme.colors.onPrimary} size={26} />
        </View>
      </View>
      <View style={styles.summary} testID="food-guide-summary">
        <View style={styles.summaryIcon}>
          <FoodVisual visualKey={scope === 'global' ? 'leafy-vegetable' : 'meal'} />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryCount}>{choiceCount}</Text>
          <Text style={styles.summaryTitle}>{t('program:lists.colorfulChoices')}</Text>
          <Text style={styles.summaryBody}>{t('program:lists.summary')}</Text>
        </View>
      </View>
      <SegmentedPicker
        label={t('program:lists.filter')}
        options={[
          { value: 'global', label: t('program:lists.global') },
          { value: 'current', label: t('program:lists.current') },
        ]}
        value={scope}
        onChange={setScope}
        testID="program-list-filter"
      />
      {program.listsStatus === 'error' ? (
        <View style={styles.warning} testID="food-lists-refresh-error">
          <Text style={styles.body}>{t('program:listRefresh.error')}</Text>
          <Button
            testID="food-lists-refresh-retry"
            label={t('program:listRefresh.retry')}
            onPress={async () => {
              await program.refreshLists();
            }}
            variant="secondary"
          />
        </View>
      ) : null}
      {lists.length === 0 ? (
        <Text style={styles.empty}>{t('program:lists.empty')}</Text>
      ) : (
        lists.map((list) => (
          <View key={list.id} style={styles.card}>
            <View style={styles.listHeading}>
              <Text style={styles.listTitle}>{text(list.name)}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {t('program:lists.itemCount', { count: list.items.length })}
                </Text>
              </View>
            </View>
            {list.description ? <Text style={styles.body}>{text(list.description)}</Text> : null}
            {list.items.map((item) => (
              <View key={item.id} style={styles.item}>
                <FoodVisual visualKey={item.visualKey} />
                <View style={styles.itemCopy}>
                  <Text style={styles.itemName}>{text(item.name)}</Text>
                  {item.portion ? (
                    <Text style={styles.meta}>
                      {t('program:lists.portion', { portion: text(item.portion) })}
                    </Text>
                  ) : null}
                  {item.notes ? <Text style={styles.meta}>{text(item.notes)}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ))
      )}
      {onClose ? (
        <Button label={t('program:actions.back')} onPress={onClose} variant="text" />
      ) : null}
    </ScrollView>
  );
});

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: theme.colors.canvas, padding: theme.spacing.lg, gap: theme.spacing.md },
  title: { ...theme.typography.h1, color: theme.colors.text },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overline: { ...theme.typography.label, color: theme.colors.secondary, letterSpacing: 0.8 },
  titleIcon: { width: 52, height: 52, borderRadius: theme.radii.lg, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '5deg' }] },
  summary: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.xl, padding: theme.spacing.lg, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.secondary, overflow: 'hidden' },
  summaryIcon: { transform: [{ scale: 1.15 }, { rotate: '-4deg' }] },
  summaryCopy: { flex: 1 },
  summaryCount: { ...theme.typography.display, color: theme.colors.secondary },
  summaryTitle: { ...theme.typography.title, color: theme.colors.text },
  summaryBody: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: theme.spacing.xs },
  listTitle: { ...theme.typography.h2, color: theme.colors.text },
  body: { ...theme.typography.body, color: theme.colors.text },
  empty: { ...theme.typography.body, color: theme.colors.textMuted },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, padding: theme.spacing.lg, gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadow },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.sm },
  countBadge: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.pill, paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm },
  countBadgeText: { ...theme.typography.caption, color: theme.colors.textMuted },
  item: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  itemCopy: { flex: 1, gap: theme.spacing.xs },
  itemName: { ...theme.typography.body, color: theme.colors.text, fontWeight: '700' as const },
  meta: { ...theme.typography.caption, color: theme.colors.textMuted },
  warning: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.lg, padding: theme.spacing.md, gap: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.reward },
});
