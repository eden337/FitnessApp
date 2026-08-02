import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { useTheme } from '../theme/ThemeProvider';

export const CelebrationBanner: React.FC<{ message: string }> = ({ message }) => {
  const theme = useTheme();
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    let preferenceChanged = false;
    const applyPreference = (enabled: boolean): void => {
      preferenceChanged = true;
      setReducedMotion(enabled);
    };
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted && !preferenceChanged) setReducedMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      applyPreference,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reducedMotion === null) return;
    if (reducedMotion) {
      entrance.stopAnimation();
      entrance.setValue(1);
      return;
    }
    const animation = Animated.spring(entrance, {
      toValue: 1,
      damping: 11,
      stiffness: 150,
      mass: 0.7,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [entrance, reducedMotion]);

  return (
    <Animated.View
      accessibilityRole="summary"
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.reward,
          borderColor: theme.foodPalette.outline,
          borderRadius: theme.radii.lg,
          opacity: entrance,
          transform: [
            {
              scale: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: reducedMotion !== false ? [1, 1] : [0.92, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.colors.surface }]}>
        <AppIcon name="sparkle" color={theme.foodPalette.outline} size={26} />
      </View>
      <Text style={[theme.typography.title, { color: theme.foodPalette.outline, flex: 1 }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    minHeight: 72,
    padding: 14,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
