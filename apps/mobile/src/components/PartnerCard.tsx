import React from 'react';
import { observer } from 'mobx-react-lite';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../i18n/I18nProvider';
import { useStores } from '../stores/StoresContext';
import { colors, radii, spacing, typography } from '../theme';

export type PartnerCardProps = { onPress?: () => void };

/**
 * Single-line summary of the user's couple status for the home screen.
 * Shows the partner's name when paired, otherwise an empty-state CTA.
 */
export const PartnerCard: React.FC<PartnerCardProps> = observer(({ onPress }) => {
  const { couple } = useStores();
  const { t } = useTranslation();
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

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  label: { ...typography.caption, color: colors.muted, marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.h2, color: colors.text },
  empty: { ...typography.body, color: colors.muted },
});
