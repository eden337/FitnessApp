import React from 'react';
import { Text, TextInput, type TextInputProps, View, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  helper?: string;
  error?: string | null;
};

/**
 * Labelled text input with optional helper text and an error state. Stays
 * intentionally simple — no animations, no fancy chrome — so it works
 * uniformly under RTL and dark mode.
 */
export const TextField: React.FC<TextFieldProps> = ({
  label,
  helper,
  error,
  testID,
  ...rest
}) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        testID={testID}
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? (
        <Text style={styles.error} testID={testID ? `${testID}-error` : undefined}>
          {error}
        </Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
    textAlign: 'auto',
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
    textAlign: 'auto',
  },
  inputError: { borderColor: colors.danger },
  helper: { ...typography.caption, color: colors.muted, marginTop: spacing.xs },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
});
