import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { useTranslation } from '../i18n/I18nProvider';
import { useStores } from '../stores/StoresContext';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ProfileSetupScreen } from '../screens/profile/ProfileSetupScreen';
import { PairScreen } from '../screens/couple/PairScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TodayScreen } from '../screens/program/TodayScreen';
import { FoodListsScreen } from '../screens/program/FoodListsScreen';
import { ProgressScreen } from '../screens/progress/ProgressScreen';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Tiny state-driven navigator. Sufficient for the current MVP; we'll graduate to
 * react-navigation once we have a tab bar (diet / progress / partner feed).
 *
 * Decision tree:
 *   status loading                    → spinner
 *   unauth + showSignUp               → SignUpScreen
 *   unauth + !showSignUp              → SignInScreen
 *   authed + no metrics               → ProfileSetupScreen
 *   authed + showPair                 → PairScreen (tapped from HomeScreen)
 *   authed + showLists                → FoodListsScreen
 *   authed + showProgram              → TodayScreen
 *   authed + has metrics              → HomeScreen
 */
export const RootNavigator: React.FC = observer(() => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { auth, profile, couple, program, progress } = useStores();
  const [showSignUp, setShowSignUp] = useState(false);
  const [showPair, setShowPair] = useState(false);
  const [showProgram, setShowProgram] = useState(false);
  const [showLists, setShowLists] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (auth.status === 'authenticated' && profile.status === 'idle') {
      void profile.fetch();
    }
    if (auth.status === 'authenticated' && couple.status === 'idle') {
      void couple.fetch();
    }
    if (auth.status === 'authenticated' && program.status === 'idle') {
      void program.fetch();
    }
    if (
      auth.status === 'authenticated' &&
      profile.isMetricsInitialized &&
      progress.status === 'idle'
    ) {
      void progress.fetch();
    }
    if (auth.status === 'unauthenticated') {
      if (profile.status !== 'idle') profile.reset();
      if (couple.status !== 'idle') couple.reset();
      if (program.status !== 'idle') program.reset();
      if (progress.status !== 'idle') progress.reset();
      setShowPair(false);
      setShowProgram(false);
      setShowLists(false);
      setShowProgress(false);
    }
  }, [
    auth.status,
    profile,
    profile.status,
    couple,
    couple.status,
    program,
    program.status,
    progress,
    progress.status,
  ]);

  if (auth.status === 'loading' && !auth.user) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.canvas }]} testID="root-loading">
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (auth.status !== 'authenticated' || !auth.user) {
    return showSignUp ? (
      <SignUpScreen onSwitchToSignIn={() => setShowSignUp(false)} />
    ) : (
      <SignInScreen onSwitchToSignUp={() => setShowSignUp(true)} />
    );
  }

  if (profile.status === 'idle' || profile.status === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.canvas }]} testID="root-loading">
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (profile.status === 'error') {
    return (
      <View
        style={[styles.center, styles.errorGap, { backgroundColor: theme.colors.canvas }]}
        testID="profile-load-error"
      >
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>
          {t('profile:loadError')}
        </Text>
        <Button
          testID="profile-load-retry"
          label={t('profile:retry')}
          onPress={() => profile.fetch()}
        />
      </View>
    );
  }

  if (!profile.isMetricsInitialized) return <ProfileSetupScreen />;
  if (showPair) return <PairScreen onClose={() => setShowPair(false)} />;
  if (showLists) return <FoodListsScreen onClose={() => setShowLists(false)} />;
  if (showProgress) return <ProgressScreen onClose={() => setShowProgress(false)} />;
  if (showProgram) {
    return (
      <TodayScreen
        onClose={() => setShowProgram(false)}
        onOpenLists={() => setShowLists(true)}
      />
    );
  }
  return (
    <HomeScreen
      onPressPartner={() => setShowPair(true)}
      onPressProgram={() => setShowProgram(true)}
      onPressProgress={() => setShowProgress(true)}
    />
  );
});

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorGap: {
    gap: 16,
    padding: 24,
  },
});
