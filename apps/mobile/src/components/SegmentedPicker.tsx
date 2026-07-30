import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppTheme } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

export type SegmentedPickerOption<V extends string> = { value: V; label: string };

export type SegmentedPickerProps<V extends string> = {
  label: string;
  options: SegmentedPickerOption<V>[];
  value: V;
  onChange: (v: V) => void;
  testID?: string;
};

/**
 * Generic typed segmented control. Used for gender, activity level, goal type
 * — anywhere we want a small, finite enum picker without a modal.
 */
export const SegmentedPicker = <V extends string>({
  label,
  options,
  value,
  onChange,
  testID,
}: SegmentedPickerProps<V>): React.ReactElement => {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              testID={testID ? `${testID}-${opt.value}` : undefined}
              accessibilityRole="button"
              onPress={() => onChange(opt.value)}
              style={[styles.chip, selected ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  wrapper: { marginBottom: theme.spacing.md },
  label: { ...theme.typography.label, color: theme.colors.textMuted, marginBottom: theme.spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
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
