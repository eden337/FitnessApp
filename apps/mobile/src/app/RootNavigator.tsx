import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from 'react-native';
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
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ActivityScreen } from '../screens/activity/ActivityScreen';
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
type AppRoute =
  | 'home'
  | 'pair'
  | 'program'
  | 'foodLists'
  | 'progress'
  | 'profile'
  | 'settings'
  | 'activity';

export const RootNavigator: React.FC = observer(() => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { auth, profile, couple, program, progress, activity } = useStores();
  const [showSignUp, setShowSignUp] = useState(false);
  const [routeStack, setRouteStack] = useState<AppRoute[]>(['home']);
  const currentRoute = routeStack[routeStack.length - 1] ?? 'home';
  const push = (route: AppRoute): void =>
    setRouteStack((routes) => (routes[routes.length - 1] === route ? routes : [...routes, route]));
  const pop = (): void =>
    setRouteStack((routes) => (routes.length > 1 ? routes.slice(0, -1) : routes));

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
      program.current?.status === 'completed' &&
      progress.status === 'idle'
    ) {
      void progress.fetch();
    }
    if (
      auth.status === 'authenticated' &&
      couple.isPaired &&
      activity.status === 'idle'
    ) {
      void activity.fetch();
    } else if (
      auth.status === 'authenticated' &&
      couple.status === 'ready' &&
      !couple.isPaired &&
      activity.status !== 'idle'
    ) {
      activity.reset();
    }
    if (
      currentRoute === 'activity' &&
      couple.status === 'ready' &&
      !couple.isPaired
    ) {
      setRouteStack(['home']);
    }
    if (auth.status === 'unauthenticated') {
      if (profile.status !== 'idle') profile.reset();
      if (couple.status !== 'idle') couple.reset();
      if (program.status !== 'idle') program.reset();
      if (progress.status !== 'idle') progress.reset();
      if (activity.status !== 'idle') activity.reset();
      setRouteStack(['home']);
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
    activity,
    activity.status,
    couple.isPaired,
    currentRoute,
    program.current?.status,
  ]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (routeStack.length <= 1) return false;
      pop();
      return true;
    });
    return () => subscription.remove();
  }, [routeStack.length]);

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
  if (currentRoute === 'pair') return <PairScreen onClose={pop} />;
  if (currentRoute === 'foodLists') return <FoodListsScreen onClose={pop} />;
  if (currentRoute === 'profile') return <ProfileScreen onBack={pop} />;
  if (currentRoute === 'settings') return <SettingsScreen onBack={pop} />;
  if (currentRoute === 'activity' && couple.isPaired) {
    return <ActivityScreen onBack={pop} />;
  }
  if (currentRoute === 'progress' && program.current?.status === 'completed') {
    return <ProgressScreen onClose={pop} />;
  }
  if (currentRoute === 'program') {
    return (
      <TodayScreen
        onClose={pop}
        onOpenLists={() => push('foodLists')}
      />
    );
  }
  return (
    <HomeScreen
      onPressPartner={() => push(couple.isPaired ? 'activity' : 'pair')}
      onPressProgram={() => push('program')}
      onPressProfile={() => push('profile')}
      onPressSettings={() => push('settings')}
      {...(program.current?.status === 'completed'
        ? { onPressProgress: () => push('progress') }
        : {})}
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
