import React from 'react';
import { Text, TextInput, type TextInputProps, View, StyleSheet } from 'react-native';
import type { AppTheme } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

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
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        testID={testID}
        placeholderTextColor={theme.colors.textMuted}
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

const createStyles = (theme: AppTheme) => StyleSheet.create({
  wrapper: { marginBottom: theme.spacing.md },
  label: {
    ...theme.typography.label,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
    textAlign: 'auto',
  },
  input: {
    ...theme.typography.body,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 48,
    textAlign: 'auto',
  },
  inputError: { borderColor: theme.colors.danger },
  helper: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: theme.spacing.xs },
  error: { ...theme.typography.caption, color: theme.colors.danger, marginTop: theme.spacing.xs },
});
