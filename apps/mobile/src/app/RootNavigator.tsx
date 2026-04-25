import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useStores } from '../stores/StoresContext';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ProfileSetupScreen } from '../screens/profile/ProfileSetupScreen';
import { PairScreen } from '../screens/couple/PairScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { colors } from '../theme';

/**
 * Tiny state-driven navigator. Sufficient for Phase 2; we'll graduate to
 * react-navigation once we have a tab bar (diet / progress / partner feed).
 *
 * Decision tree:
 *   status loading                    → spinner
 *   unauth + showSignUp               → SignUpScreen
 *   unauth + !showSignUp              → SignInScreen
 *   authed + no metrics               → ProfileSetupScreen
 *   authed + showPair                 → PairScreen (tapped from HomeScreen)
 *   authed + has metrics              → HomeScreen
 */
export const RootNavigator: React.FC = observer(() => {
  const { auth, profile, couple } = useStores();
  const [showSignUp, setShowSignUp] = useState(false);
  const [showPair, setShowPair] = useState(false);

  useEffect(() => {
    if (auth.status === 'authenticated' && profile.status === 'idle') {
      void profile.fetch();
    }
    if (auth.status === 'authenticated' && couple.status === 'idle') {
      void couple.fetch();
    }
    if (auth.status === 'unauthenticated') {
      if (profile.status !== 'idle') profile.reset();
      if (couple.status !== 'idle') couple.reset();
      setShowPair(false);
    }
  }, [auth.status, profile, profile.status, couple, couple.status]);

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

  if (!profile.isMetricsInitialized) return <ProfileSetupScreen />;
  if (showPair) return <PairScreen onClose={() => setShowPair(false)} />;
  return <HomeScreen onPressPartner={() => setShowPair(true)} />;
});

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
