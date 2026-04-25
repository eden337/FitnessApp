import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useTranslation } from '../../i18n/I18nProvider';
import { useStores } from '../../stores/StoresContext';
import { colors, radii, spacing, typography } from '../../theme';

export type PairScreenProps = { onClose?: () => void };

export const PairScreen: React.FC<PairScreenProps> = observer(({ onClose }) => {
  const { couple } = useStores();
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [touchedCode, setTouchedCode] = useState(false);
  const inviteCode = couple.inviteCode;

  const submitJoin = async (): Promise<void> => {
    setTouchedCode(true);
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 8) return;
    const ok = await couple.join(trimmed);
    if (ok) onClose?.();
  };

  const submitCreate = async (): Promise<void> => {
    await couple.create();
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID="pair-screen">
      <Text style={styles.title}>{t('couple:title')}</Text>
      <Text style={styles.subtitle}>{t('couple:subtitle')}</Text>

      {inviteCode ? (
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>{t('couple:code.label')}</Text>
          <Text style={styles.codeValue} testID="pair-code">{inviteCode}</Text>
          <Text style={styles.instructions}>{t('couple:create.instructions')}</Text>
        </View>
      ) : (
        <View style={styles.actionsBlock}>
          <Button
            testID="pair-create"
            label={
              couple.status === 'loading'
                ? t('couple:create.loading')
                : t('couple:create.cta')
            }
            onPress={submitCreate}
            loading={couple.status === 'loading'}
          />

          <Text style={styles.divider}>—</Text>

          <TextField
            testID="pair-code-input"
            label={t('couple:join.label')}
            placeholder={t('couple:join.placeholder')}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            error={
              touchedCode && code.trim().length > 0 && code.trim().length !== 8
                ? t('couple:errors.invalid_body')
                : null
            }
          />
          <Button
            testID="pair-join"
            variant="secondary"
            label={
              couple.status === 'loading' ? t('couple:join.loading') : t('couple:join.cta')
            }
            onPress={submitJoin}
            loading={couple.status === 'loading'}
          />
        </View>
      )}

      {couple.errorMessage ? (
        <Text style={styles.serverError} testID="pair-server-error">
          {t(`couple:errors.${couple.errorMessage}`, {
            defaultValue: t('couple:errors.fallback'),
          })}
        </Text>
      ) : null}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  codeLabel: { ...typography.caption, color: colors.muted },
  codeValue: {
    ...typography.h1,
    color: colors.primary,
    letterSpacing: 4,
    textAlign: 'center',
  },
  instructions: { ...typography.body, color: colors.muted },
  actionsBlock: { gap: spacing.md },
  divider: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  serverError: {
    ...typography.body,
    color: colors.danger,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
