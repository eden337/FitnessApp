import { serializeDateOnly, todayInIsrael } from './israel-date.js';

describe('Israel calendar dates', () => {
  it('returns the calendar date in Israel near a UTC day boundary', () => {
    expect(todayInIsrael(new Date('2026-07-29T22:30:00.000Z'))).toBe('2026-07-30');
  });

  it('serializes a database DATE without shifting local midnight to UTC', () => {
    expect(serializeDateOnly(new Date(2026, 6, 30))).toBe('2026-07-30');
  });

  it('preserves a date-only string', () => {
    expect(serializeDateOnly('2026-07-30')).toBe('2026-07-30');
  });
});
