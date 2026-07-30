import type { WeightLog } from '@fitnessapp/shared';
import { buildWeightTrend } from './weightTrend';

const log = (loggedOn: string, weightKg: number): WeightLog => ({
  id: `550e8400-e29b-41d4-a716-${loggedOn.replaceAll('-', '').padEnd(12, '0')}`,
  loggedOn,
  weightKg,
  bodyFatPct: null,
  notes: null,
  createdAt: `${loggedOn}T06:00:00.000Z`,
  updatedAt: `${loggedOn}T06:00:00.000Z`,
});

describe('buildWeightTrend', () => {
  const logs = [
    log('2026-07-30', 80),
    log('2026-07-15', 81),
    log('2026-06-25', 82),
    log('2026-03-01', 84),
  ];

  it('filters inclusively to the selected calendar window and sorts oldest first', () => {
    const trend = buildWeightTrend(logs, 30, '2026-07-30');

    expect(trend.points.map((point) => point.loggedOn)).toEqual([
      '2026-07-15',
      '2026-07-30',
    ]);
    expect(trend.changeKg).toBe(-1);
  });

  it('normalizes points while preserving flat and single-point series', () => {
    const flat = buildWeightTrend([
      log('2026-07-01', 80),
      log('2026-07-30', 80),
    ], 30, '2026-07-30');
    expect(flat.points.map((point) => point.normalizedY)).toEqual([0.5, 0.5]);

    const single = buildWeightTrend([log('2026-07-30', 80)], 30, '2026-07-30');
    expect(single.points[0]).toMatchObject({ normalizedX: 0.5, normalizedY: 0.5 });
    expect(single.changeKg).toBeNull();
  });

  it('supports the complete 365-day maintenance window', () => {
    const trend = buildWeightTrend(logs, 365, '2026-07-30');

    expect(trend.points).toHaveLength(4);
    expect(trend.minKg).toBe(80);
    expect(trend.maxKg).toBe(84);
  });
});
