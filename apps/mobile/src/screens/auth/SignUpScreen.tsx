import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Gender } from '@fitnessapp/shared';
import { Button } from '../../components/Button';
import { LocaleToggle } from '../../components/LocaleToggle';
import { SegmentedPicker } from '../../components/SegmentedPicker';
import { TextField } from '../../components/TextField';
import { useTranslation } from '../../i18n/I18nProvider';
import { useStores } from '../../stores/StoresContext';
import type { AppTheme } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';
import {
  compactErrors,
  validateBirthDate,
  validateEmail,
  validateHeightCm,
  validatePassword,
  validateRequired,
} from '../../utils/validation';

export type SignUpScreenProps = { onSwitchToSignIn: () => void };

type Errors = Partial<{
  email: string;
  password: string;
  displayName: string;
  birthDate: string;
  heightCm: string;
}>;

export const SignUpScreen: React.FC<SignUpScreenProps> = observer(({ onSwitchToSignIn }) => {
  const { auth, locale } = useStores();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [birthDate, setBirthDate] = useState('');
  const [heightCmText, setHeightCmText] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const submit = async (): Promise<void> => {
    const heightCm = Number(heightCmText);
    const next = compactErrors({
      email: validateEmail(email),
      password: validatePassword(password),
      displayName: validateRequired(displayName),
      birthDate: validateBirthDate(birthDate),
      heightCm: validateHeightCm(heightCm),
    });
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    await auth.signUp({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      locale: locale.locale,
      gender,
      birthDate: birthDate.trim(),
      heightCm,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID="signup-screen">
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth:signUp.title')}</Text>
        <Text style={styles.subtitle}>{t('auth:signUp.subtitle')}</Text>
      </View>

      <TextField
        testID="signup-email"
        label={t('auth:signUp.emailLabel')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        error={errors.email ? t(errors.email) : null}
      />
      <TextField
        testID="signup-password"
        label={t('auth:signUp.passwordLabel')}
        helper={t('auth:signUp.passwordHint')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password ? t(errors.password) : null}
      />
      <TextField
        testID="signup-displayName"
        label={t('auth:signUp.displayNameLabel')}
        value={displayName}
        onChangeText={setDisplayName}
        error={errors.displayName ? t(errors.displayName) : null}
      />
      <SegmentedPicker
        testID="signup-gender"
        label={t('auth:signUp.genderLabel')}
        value={gender}
        onChange={setGender}
        options={[
          { value: 'female', label: t('auth:signUp.gender.female') },
          { value: 'male', label: t('auth:signUp.gender.male') },
          { value: 'other', label: t('auth:signUp.gender.other') },
        ]}
      />
      <TextField
        testID="signup-birthDate"
        label={t('auth:signUp.birthDateLabel')}
        placeholder="1990-01-15"
        value={birthDate}
        onChangeText={setBirthDate}
        keyboardType="numbers-and-punctuation"
        error={errors.birthDate ? t(errors.birthDate) : null}
      />
      <TextField
        testID="signup-heightCm"
        label={t('auth:signUp.heightLabel')}
        value={heightCmText}
        onChangeText={setHeightCmText}
        keyboardType="number-pad"
        error={errors.heightCm ? t(errors.heightCm) : null}
      />

      {auth.errorMessage ? (
        <Text style={styles.serverError} testID="signup-server-error">
          {t(`auth:errors.${auth.errorMessage}`, { defaultValue: t('auth:errors.fallback') })}
        </Text>
      ) : null}

      <Button
        testID="signup-submit"
        label={auth.status === 'loading' ? t('auth:signUp.loading') : t('auth:signUp.submit')}
        onPress={submit}
        loading={auth.status === 'loading'}
      />

      <View style={styles.footer}>
        <Button
          testID="signup-switch"
          variant="text"
          label={t('auth:signUp.switchToSignIn')}
          onPress={onSwitchToSignIn}
        />
        <LocaleToggle />
      </View>
    </ScrollView>
  );
});

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: theme.colors.canvas, padding: theme.spacing.lg },
  header: { marginBottom: theme.spacing.lg },
  title: { ...theme.typography.display, color: theme.colors.text, marginBottom: theme.spacing.sm },
  subtitle: { ...theme.typography.body, color: theme.colors.textMuted },
  serverError: {
    ...theme.typography.body,
    color: theme.colors.danger,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  footer: { marginTop: theme.spacing.lg, gap: theme.spacing.md },
});
