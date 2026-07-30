import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useTranslation } from '../../i18n/I18nProvider';
import { useStores } from '../../stores/StoresContext';
import type { AppTheme } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

export type PairScreenProps = { onClose?: () => void };

export const PairScreen: React.FC<PairScreenProps> = observer(({ onClose }) => {
  const { couple } = useStores();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
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

      {onClose ? (
        <Button
          testID="pair-back"
          variant="secondary"
          label={t('common:actions.back')}
          onPress={onClose}
        />
      ) : null}
    </ScrollView>
  );
});

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: theme.colors.canvas,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: { ...theme.typography.h1, color: theme.colors.text, marginBottom: theme.spacing.sm },
  subtitle: { ...theme.typography.body, color: theme.colors.textMuted, marginBottom: theme.spacing.lg },
  codeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  codeLabel: { ...theme.typography.caption, color: theme.colors.textMuted },
  codeValue: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    letterSpacing: 4,
    textAlign: 'center',
  },
  instructions: { ...theme.typography.body, color: theme.colors.textMuted },
  actionsBlock: { gap: theme.spacing.md },
  divider: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginVertical: theme.spacing.sm,
  },
  serverError: {
    ...theme.typography.body,
    color: theme.colors.danger,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});
