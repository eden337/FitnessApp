import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppTheme } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

export type ButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  leadingIcon?: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  testID,
  leadingIcon,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const isDisabled = disabled || loading;
  const variantStyles = {
    primary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    secondary: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
    text: { backgroundColor: 'transparent', borderColor: 'transparent' },
  };
  const textColor = {
    primary: theme.colors.onPrimary,
    secondary: theme.colors.text,
    text: theme.colors.primary,
  };
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={textColor[variant]} /> : null}
        {!loading && leadingIcon ? leadingIcon : null}
        <Text style={[styles.label, { color: textColor[variant] }]}>{label}</Text>
      </View>
    </Pressable>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  base: {
    minHeight: 48,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' },
  label: { ...theme.typography.body, fontWeight: '700' as const },
});
