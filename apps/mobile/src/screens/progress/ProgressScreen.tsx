import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CreateWeightLogInputSchema,
  type CreateWeightLogInput,
} from '@fitnessapp/shared';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useTranslation } from '../../i18n/I18nProvider';
import { useStores } from '../../stores/StoresContext';
import type { AppTheme } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

export const ProgressScreen: React.FC<{ onClose?: () => void }> = observer(({ onClose }) => {
  const { progress } = useStores();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [notes, setNotes] = useState('');
  const [weightError, setWeightError] = useState<string | null>(null);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (): Promise<void> => {
    const candidate = {
      weightKg: Number(weight),
      ...(date.trim() ? { loggedOn: date.trim() } : {}),
      ...(bodyFat.trim() ? { bodyFatPct: Number(bodyFat) } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    const parsed = CreateWeightLogInputSchema.safeParse(candidate);
    if (!parsed.success) {
      const hasWeightIssue = parsed.error.issues.some((issue) => issue.path[0] === 'weightKg');
      setWeightError(hasWeightIssue ? t('progress:validation.weight') : null);
      setEntryError(hasWeightIssue ? null : t('progress:validation.entry'));
      return;
    }
    setWeightError(null);
    setEntryError(null);
    setSaving(true);
    const saved = await progress.logWeight(parsed.data as CreateWeightLogInput);
    setSaving(false);
    if (saved) {
      setWeight('');
      setBodyFat('');
      setNotes('');
    } else {
      setEntryError(t('progress:errors.save'));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID="progress-screen">
      <Text style={styles.title}>{t('progress:title')}</Text>
      <Text style={styles.privacy}>{t('progress:privacy')}</Text>

      <View style={styles.form}>
        <TextField
          testID="progress-weight-input"
          label={t('progress:form.weight')}
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
          error={weightError}
        />
        <TextField
          testID="progress-date-input"
          label={t('progress:form.date')}
          value={date}
          onChangeText={setDate}
          autoCapitalize="none"
        />
        <TextField
          testID="progress-body-fat-input"
          label={t('progress:form.bodyFat')}
          keyboardType="decimal-pad"
          value={bodyFat}
          onChangeText={setBodyFat}
        />
        <TextField
          testID="progress-notes-input"
          label={t('progress:form.notes')}
          value={notes}
          onChangeText={setNotes}
          maxLength={500}
        />
        {entryError ? <Text style={styles.error}>{entryError}</Text> : null}
        <Button
          testID="progress-save"
          label={t('progress:form.save')}
          onPress={save}
          loading={saving}
        />
      </View>

      <Text style={styles.sectionTitle}>{t('progress:history.title')}</Text>
      {progress.status === 'error' ? (
        <Text style={styles.error}>{t('progress:errors.load')}</Text>
      ) : progress.logs.length === 0 ? (
        <Text style={styles.empty}>{t('progress:history.empty')}</Text>
      ) : (
        progress.logs.map((entry) => (
          <View key={entry.id} style={styles.logCard}>
            <View style={styles.logRow}>
              <Text style={styles.logWeight}>{entry.weightKg} kg</Text>
              <Text style={styles.logDate}>{entry.loggedOn}</Text>
            </View>
            {entry.bodyFatPct !== null ? (
              <Text style={styles.detail}>
                {t('progress:history.bodyFat', { value: entry.bodyFatPct })}
              </Text>
            ) : null}
            {entry.notes ? <Text style={styles.detail}>{entry.notes}</Text> : null}
          </View>
        ))
      )}

      {onClose ? (
        <Button
          testID="progress-back"
          variant="secondary"
          label={t('common:actions.back')}
          onPress={onClose}
        />
      ) : null}
    </ScrollView>
  );
});

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: theme.colors.canvas, padding: theme.spacing.lg, gap: theme.spacing.md },
  title: { ...theme.typography.h1, color: theme.colors.text },
  privacy: { ...theme.typography.caption, color: theme.colors.textMuted },
  form: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadow },
  sectionTitle: { ...theme.typography.h2, color: theme.colors.text, marginTop: theme.spacing.md },
  empty: { ...theme.typography.body, color: theme.colors.textMuted },
  error: { ...theme.typography.caption, color: theme.colors.danger, marginBottom: theme.spacing.sm },
  logCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  logRow: { flexDirection: 'row', justifyContent: 'space-between' },
  logWeight: { ...theme.typography.body, color: theme.colors.text, fontWeight: '700' as const },
  logDate: { ...theme.typography.caption, color: theme.colors.textMuted },
  detail: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: theme.spacing.xs },
});
