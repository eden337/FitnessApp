import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { LocaleToggle } from '../../components/LocaleToggle';
import { TextField } from '../../components/TextField';
import { useTranslation } from '../../i18n/I18nProvider';
import { useStores } from '../../stores/StoresContext';
import type { AppTheme } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';
import {
  compactErrors,
  validateEmail,
  validatePassword,
} from '../../utils/validation';

export type SignInScreenProps = { onSwitchToSignUp: () => void };

export const SignInScreen: React.FC<SignInScreenProps> = observer(({ onSwitchToSignUp }) => {
  const { auth } = useStores();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = async (): Promise<void> => {
    const next = compactErrors({
      email: validateEmail(email),
      password: validatePassword(password),
    });
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    await auth.signIn(email.trim(), password);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID="signin-screen">
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth:signIn.title')}</Text>
        <Text style={styles.subtitle}>{t('auth:signIn.subtitle')}</Text>
      </View>

      <TextField
        testID="signin-email"
        label={t('auth:signIn.emailLabel')}
        placeholder={t('auth:signIn.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        error={errors.email ? t(errors.email) : null}
      />
      <TextField
        testID="signin-password"
        label={t('auth:signIn.passwordLabel')}
        placeholder={t('auth:signIn.passwordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        error={errors.password ? t(errors.password) : null}
      />

      {auth.errorMessage ? (
        <Text style={styles.serverError} testID="signin-server-error">
          {t(`auth:errors.${auth.errorMessage}`, { defaultValue: t('auth:errors.fallback') })}
        </Text>
      ) : null}

      <Button
        testID="signin-submit"
        label={auth.status === 'loading' ? t('auth:signIn.loading') : t('auth:signIn.submit')}
        onPress={submit}
        loading={auth.status === 'loading'}
      />

      <View style={styles.footer}>
        <Button
          testID="signin-switch"
          variant="text"
          label={t('auth:signIn.switchToSignUp')}
          onPress={onSwitchToSignUp}
        />
        <LocaleToggle />
      </View>
    </ScrollView>
  );
});

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: theme.colors.canvas,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: { marginBottom: theme.spacing.xl },
  title: { ...theme.typography.display, color: theme.colors.text, marginBottom: theme.spacing.sm },
  subtitle: { ...theme.typography.body, color: theme.colors.textMuted },
  serverError: {
    ...theme.typography.body,
    color: theme.colors.danger,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  footer: { marginTop: theme.spacing.xl, gap: theme.spacing.md },
});
