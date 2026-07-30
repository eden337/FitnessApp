import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { useTranslation } from '../i18n/I18nProvider';
import { useStores } from '../stores/StoresContext';
import type { AppTheme } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

export const ScreenHeader: React.FC<{ title: string; onBack: () => void }> = ({
  title,
  onBack,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { locale } = useStores();
  const styles = createStyles(theme);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={t('common:actions.back')}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onBack}
        style={({ pressed }) => [styles.back, pressed ? styles.pressed : null]}
        testID="screen-back"
      >
        <View style={locale.isRtl ? styles.rtlIcon : null}>
          <AppIcon name="back" color={theme.colors.text} size={26} />
        </View>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 52,
    },
    back: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    pressed: { opacity: 0.76 },
    rtlIcon: { transform: [{ scaleX: -1 }] },
    title: { ...theme.typography.h2, color: theme.colors.text },
    spacer: { width: 48 },
  });
