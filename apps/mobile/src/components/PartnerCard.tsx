import React from 'react';
import { observer } from 'mobx-react-lite';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../i18n/I18nProvider';
import { useStores } from '../stores/StoresContext';
import type { AppTheme } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

export type PartnerCardProps = { onPress?: () => void };

/**
 * Single-line summary of the user's couple status for the home screen.
 * Shows the partner's name when paired, otherwise an empty-state CTA.
 */
export const PartnerCard: React.FC<PartnerCardProps> = observer(({ onPress }) => {
  const { couple } = useStores();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const partner = couple.view?.partners[0];

  return (
    <Pressable
      testID="partner-card"
      accessibilityRole="button"
      onPress={onPress}
      style={styles.wrapper}
    >
      <Text style={styles.label}>{t('couple:partnerCard.label')}</Text>
      {partner ? (
        <View style={styles.row}>
          <Text style={styles.name} testID="partner-card-name">{partner.displayName}</Text>
        </View>
      ) : (
        <Text style={styles.empty} testID="partner-card-empty">
          {t('couple:partnerCard.alone')}
        </Text>
      )}
    </Pressable>
  );
});

const createStyles = (theme: AppTheme) => StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  label: { ...theme.typography.label, color: theme.colors.secondary, marginBottom: theme.spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  name: { ...theme.typography.h2, color: theme.colors.text },
  empty: { ...theme.typography.body, color: theme.colors.textMuted },
});
