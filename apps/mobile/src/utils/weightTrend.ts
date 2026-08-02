import type { WeightLog } from '@fitnessapp/shared';

export type TrendWindowDays = 30 | 90 | 365;

export type WeightTrendPoint = {
  loggedOn: string;
  weightKg: number;
  normalizedX: number;
  normalizedY: number;
};

export type WeightTrend = {
  points: WeightTrendPoint[];
  minKg: number | null;
  maxKg: number | null;
  changeKg: number | null;
};

const DAY_MS = 86_400_000;

const toUtcDay = (dateOnly: string): number =>
  Date.parse(`${dateOnly}T00:00:00.000Z`);

export const buildWeightTrend = (
  logs: readonly WeightLog[],
  windowDays: TrendWindowDays,
  today: string,
): WeightTrend => {
  const end = toUtcDay(today);
  const start = end - (windowDays - 1) * DAY_MS;
  const visible = logs
    .filter((entry) => {
      const timestamp = toUtcDay(entry.loggedOn);
      return timestamp >= start && timestamp <= end;
    })
    .sort((left, right) => left.loggedOn.localeCompare(right.loggedOn));

  if (visible.length === 0) {
    return { points: [], minKg: null, maxKg: null, changeKg: null };
  }

  const weights = visible.map((entry) => entry.weightKg);
  const minKg = Math.min(...weights);
  const maxKg = Math.max(...weights);
  const rangeKg = maxKg - minKg;
  const periodMs = end - start;
  const points = visible.map((entry) => ({
    loggedOn: entry.loggedOn,
    weightKg: entry.weightKg,
    normalizedX: visible.length === 1
      ? 0.5
      : (toUtcDay(entry.loggedOn) - start) / periodMs,
    normalizedY: rangeKg === 0 ? 0.5 : (entry.weightKg - minKg) / rangeKg,
  }));
  const changeKg = visible.length < 2
    ? null
    : Math.round((visible[visible.length - 1]!.weightKg - visible[0]!.weightKg) * 100) / 100;

  return { points, minKg, maxKg, changeKg };
};
