import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

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

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.muted, marginBottom: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { ...typography.body, color: colors.text },
  chipTextSelected: { color: '#0B1020', fontWeight: '600' as const },
});
