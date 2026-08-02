import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { useTheme } from '../theme/ThemeProvider';

export const MissionHero: React.FC<{
  eyebrow: string;
  title: string;
  body: string;
  onPress?: () => void;
  testID?: string;
}> = ({ eyebrow, title, body, onPress, testID }) => {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.hero,
        {
          backgroundColor: theme.colors.progress,
          borderColor: theme.colors.focus,
          borderRadius: theme.radii.xl,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.orbLarge,
          { backgroundColor: theme.colors.primary, borderRadius: theme.radii.pill },
        ]}
      />
      <View
        style={[
          styles.orbSmall,
          { backgroundColor: theme.colors.reward, borderRadius: theme.radii.pill },
        ]}
      />
      <View style={styles.copy}>
        <Text style={[theme.typography.caption, styles.eyebrow, { color: theme.colors.onProgress }]}>
          {eyebrow}
        </Text>
        <Text style={[theme.typography.h1, { color: theme.colors.onProgress }]}>
          {title}
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.onProgress }]}>
          {body}
        </Text>
      </View>
      <View style={[styles.icon, { backgroundColor: theme.colors.surface }]}>
        <AppIcon name="sparkle" color={theme.colors.progress} size={30} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  hero: {
    minHeight: 176,
    padding: 22,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: { flex: 1, gap: 5, zIndex: 2 },
  eyebrow: { letterSpacing: 1, opacity: 0.84 },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  orbLarge: {
    position: 'absolute',
    width: 150,
    height: 150,
    end: -58,
    top: -54,
    opacity: 0.7,
  },
  orbSmall: {
    position: 'absolute',
    width: 52,
    height: 52,
    end: 72,
    bottom: -20,
    opacity: 0.86,
  },
});
