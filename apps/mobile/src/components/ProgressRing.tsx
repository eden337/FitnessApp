import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export const ProgressRing: React.FC<{
  progress: number;
  label: string;
  size?: number;
}> = ({ progress, label, size = 96 }) => {
  const theme = useTheme();
  const normalized = Math.max(0, Math.min(100, progress));
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: normalized }}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.colors.border}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
          stroke={theme.colors.progress}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - normalized / 100)}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </Svg>
      <View style={styles.copy}>
        <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
          {label}
        </Text>
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
          {normalized}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  svg: { position: 'absolute' },
  copy: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
