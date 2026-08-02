import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import type { WeightLog } from '@fitnessapp/shared';
import { useTranslation } from '../i18n/I18nProvider';
import type { AppTheme } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import {
  buildWeightTrend,
  type TrendWindowDays,
} from '../utils/weightTrend';
import { SegmentedPicker } from './SegmentedPicker';

type WeightTrendCardProps = {
  logs: readonly WeightLog[];
  today?: string;
};

type TrendWindowValue = '30' | '90' | '365';

const chart = { left: 20, top: 20, width: 260, height: 90 } as const;

const localDateOnly = (): string => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
};

const formatValue = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

const formatChange = (value: number): string =>
  `${value > 0 ? '+' : ''}${formatValue(value)}`;

export const WeightTrendCard: React.FC<WeightTrendCardProps> = ({ logs, today }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [windowValue, setWindowValue] = useState<TrendWindowValue>('30');
  const windowDays = Number(windowValue) as TrendWindowDays;
  const trend = useMemo(
    () => buildWeightTrend(logs, windowDays, today ?? localDateOnly()),
    [logs, today, windowDays],
  );
  const path = trend.points
    .map((point, index) => {
      const x = chart.left + point.normalizedX * chart.width;
      const y = chart.top + (1 - point.normalizedY) * chart.height;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('progress:trend.title')}</Text>
      <SegmentedPicker
        label={t('progress:trend.range')}
        options={[
          { label: t('progress:trend.window30'), value: '30' },
          { label: t('progress:trend.window90'), value: '90' },
          { label: t('progress:trend.window365'), value: '365' },
        ]}
        value={windowValue}
        onChange={setWindowValue}
        testID="progress-trend-window"
      />

      {trend.points.length < 2 ? (
        <Text style={styles.empty}>{t('progress:trend.notEnough')}</Text>
      ) : (
        <>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={t('progress:trend.accessibility', {
              days: windowDays,
              count: trend.points.length,
            })}
            testID="progress-trend-chart"
          >
            <Svg height={130} width="100%" viewBox="0 0 300 130">
              {[0, 0.5, 1].map((position) => (
                <Line
                  key={position}
                  x1={chart.left}
                  x2={chart.left + chart.width}
                  y1={chart.top + position * chart.height}
                  y2={chart.top + position * chart.height}
                  stroke={theme.colors.border}
                  strokeWidth={1}
                />
              ))}
              <Path
                d={path}
                fill="none"
                stroke={theme.colors.progress}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={4}
              />
              {trend.points.map((point) => (
                <Circle
                  key={point.loggedOn}
                  cx={chart.left + point.normalizedX * chart.width}
                  cy={chart.top + (1 - point.normalizedY) * chart.height}
                  fill={theme.colors.surface}
                  stroke={theme.colors.progress}
                  strokeWidth={3}
                  r={5}
                />
              ))}
            </Svg>
          </View>
          <View style={styles.stats}>
            <Text style={styles.statMuted}>
              {t('progress:trend.minimum', { value: formatValue(trend.minKg!) })}
            </Text>
            <Text style={styles.statMuted}>
              {t('progress:trend.maximum', { value: formatValue(trend.maxKg!) })}
            </Text>
            <Text style={styles.stat}>
              {t('progress:trend.change', { value: formatChange(trend.changeKg!) })}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    ...theme.shadow,
  },
  empty: { ...theme.typography.body, color: theme.colors.textMuted, paddingVertical: theme.spacing.md },
  stat: { ...theme.typography.caption, color: theme.colors.text, fontWeight: '700' as const },
  statMuted: { ...theme.typography.caption, color: theme.colors.textMuted },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  title: { ...theme.typography.h2, color: theme.colors.text },
});
