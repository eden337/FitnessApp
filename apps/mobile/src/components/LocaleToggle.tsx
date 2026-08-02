import React from 'react';
import { observer } from 'mobx-react-lite';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStores } from '../stores/StoresContext';
import type { AppTheme } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import { useTranslation } from '../i18n/I18nProvider';

/**
 * Tiny he ↔ en toggle. Tapping flips locale immediately and persists it.
 * The active locale is highlighted; the visible labels are taken from
 * `common.locale.{he,en}` so the names render in their own language.
 */
export const LocaleToggle: React.FC = observer(() => {
  const { locale } = useStores();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
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

const createStyles = (theme: AppTheme) => StyleSheet.create({
  wrapper: { marginBottom: theme.spacing.md },
  label: { ...theme.typography.label, color: theme.colors.textMuted, marginBottom: theme.spacing.xs },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { ...theme.typography.body, color: theme.colors.text },
  chipTextSelected: { color: theme.colors.onPrimary, fontWeight: '700' as const },
});
