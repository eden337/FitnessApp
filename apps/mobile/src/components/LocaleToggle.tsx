import React from 'react';
import { observer } from 'mobx-react-lite';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStores } from '../stores/StoresContext';
import { colors, radii, spacing, typography } from '../theme';
import { useTranslation } from '../i18n/I18nProvider';

/**
 * Tiny he ↔ en toggle. Tapping flips locale immediately and persists it.
 * The active locale is highlighted; the visible labels are taken from
 * `common.locale.{he,en}` so the names render in their own language.
 */
export const LocaleToggle: React.FC = observer(() => {
  const { locale } = useStores();
  const { t } = useTranslation();
  const choices: Array<{ value: 'he' | 'en'; label: string }> = [
    { value: 'he', label: t('common:locale.he') },
    { value: 'en', label: t('common:locale.en') },
  ];
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('common:locale.label')}</Text>
      <View style={styles.row}>
        {choices.map((c) => {
          const selected = locale.locale === c.value;
          return (
            <Pressable
              key={c.value}
              testID={`locale-toggle-${c.value}`}
              accessibilityRole="button"
              onPress={() => void locale.set(c.value)}
              style={[styles.chip, selected ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.muted, marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { ...typography.body, color: colors.text },
  chipTextSelected: { color: '#0B1020', fontWeight: '600' as const },
});
