import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useStores } from '../stores/StoresContext';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ProfileSetupScreen } from '../screens/profile/ProfileSetupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { colors } from '../theme';

/**
 * Tiny state-driven navigator. Sufficient for Phase 1; we'll graduate to
 * react-navigation once we have a tab bar (diet / progress / partner feed).
 *
 * Decision tree:
 *   status loading       → spinner
 *   unauth + showSignUp  → SignUpScreen
 *   unauth + !showSignUp → SignInScreen
 *   authed + no metrics  → ProfileSetupScreen
 *   authed + has metrics → HomeScreen
 */
export const RootNavigator: React.FC = observer(() => {
  const { auth, profile } = useStores();
  const [showSignUp, setShowSignUp] = useState(false);

  // After authentication, hydrate the profile so the navigator can decide
  // whether to show setup or home.
  useEffect(() => {
    if (auth.status === 'authenticated' && profile.status === 'idle') {
      void profile.fetch();
    }
    if (auth.status === 'unauthenticated' && profile.status !== 'idle') {
      profile.reset();
    }
  }, [auth.status, profile, profile.status]);

  if (auth.status === 'loading' && !auth.user) {
    return (
      <View style={styles.center} testID="root-loading">
        <ActivityIndicator color={colors.primary} />
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

  return profile.isMetricsInitialized ? <HomeScreen /> : <ProfileSetupScreen />;
});

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
