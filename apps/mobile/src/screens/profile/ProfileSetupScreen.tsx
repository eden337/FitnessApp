import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ActivityLevel, GoalType } from '@fitnessapp/shared';
import { Button } from '../../components/Button';
import { SegmentedPicker } from '../../components/SegmentedPicker';
import { TextField } from '../../components/TextField';
import { useTranslation } from '../../i18n/I18nProvider';
import { useStores } from '../../stores/StoresContext';
import { colors, spacing, typography } from '../../theme';
import { compactErrors, validateWeightKg } from '../../utils/validation';

export const ProfileSetupScreen: React.FC = observer(() => {
  const { profile, auth } = useStores();
  const { t } = useTranslation();
  const [weight, setWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<GoalType>('maintain');
  const [errors, setErrors] = useState<{ weight?: string; goalWeight?: string }>({});

  const submit = async (): Promise<void> => {
    const weightKg = Number(weight);
    const goalWeightKg = goalWeight === '' ? null : Number(goalWeight);
    const next = compactErrors({
      weight: validateWeightKg(weightKg),
      goalWeight: goalWeightKg === null ? null : validateWeightKg(goalWeightKg),
    });
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const u = auth.user;
    if (!u) return;
    await profile.setupMetrics({
      gender: u.gender,
      birthDate: u.birthDate,
      heightCm: u.heightCm,
      currentWeightKg: weightKg,
      activityLevel: activity,
      goalType: goal,
      goalWeightKg,
      dietaryRestrictions: {},
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID="profile-setup-screen">
      <Text style={styles.title}>{t('profile:setup.title')}</Text>
      <Text style={styles.subtitle}>{t('profile:setup.subtitle')}</Text>

      <TextField
        testID="setup-weight"
        label={t('profile:setup.currentWeightLabel')}
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        error={errors.weight ? t(errors.weight) : null}
      />
      <SegmentedPicker
        testID="setup-activity"
        label={t('profile:setup.activityLabel')}
        value={activity}
        onChange={setActivity}
        options={
          (['sedentary', 'light', 'moderate', 'high', 'athlete'] as const).map((v) => ({
            value: v,
            label: t(`profile:setup.activity.${v}`),
          }))
        }
      />
      <SegmentedPicker
        testID="setup-goal"
        label={t('profile:setup.goalLabel')}
        value={goal}
        onChange={setGoal}
        options={
          (['lose', 'maintain', 'gain'] as const).map((v) => ({
            value: v,
            label: t(`profile:setup.goal.${v}`),
          }))
        }
      />
      <TextField
        testID="setup-goalWeight"
        label={t('profile:setup.goalWeightLabel')}
        value={goalWeight}
        onChangeText={setGoalWeight}
        keyboardType="decimal-pad"
        error={errors.goalWeight ? t(errors.goalWeight) : null}
      />

      {profile.errorMessage ? (
        <Text style={styles.serverError} testID="setup-server-error">
          {profile.errorMessage}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          testID="setup-submit"
          label={t('profile:setup.submit')}
          onPress={submit}
          loading={profile.status === 'loading'}
        />
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  serverError: {
    ...typography.body,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  actions: { marginTop: spacing.lg },
});
