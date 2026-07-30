import {
  CreateWeightLogInputSchema,
  WeightHistoryQuerySchema,
  WeightLogSchema,
} from './progress.js';

describe('progress schemas', () => {
  it('accepts a bounded weight entry', () => {
    expect(
      CreateWeightLogInputSchema.parse({
        loggedOn: '2026-07-30',
        weightKg: 81.4,
        bodyFatPct: 21.5,
        notes: 'Morning measurement',
      }),
    ).toEqual({
      loggedOn: '2026-07-30',
      weightKg: 81.4,
      bodyFatPct: 21.5,
      notes: 'Morning measurement',
    });
  });

  it('allows the server to default the log date', () => {
    expect(CreateWeightLogInputSchema.parse({ weightKg: 81.4 })).toEqual({
      weightKg: 81.4,
    });
  });

  it('rejects invalid measurements and unknown fields', () => {
    expect(() => CreateWeightLogInputSchema.parse({ weightKg: 301 })).toThrow();
    expect(() =>
      CreateWeightLogInputSchema.parse({ loggedOn: '2026-02-30', weightKg: 80 }),
    ).toThrow();
    expect(() =>
      CreateWeightLogInputSchema.parse({ weightKg: 80, sharedWithPartner: true }),
    ).toThrow();
  });

  it('coerces and bounds history queries', () => {
    expect(WeightHistoryQuerySchema.parse({ limit: '30' })).toEqual({ limit: 30 });
    expect(() => WeightHistoryQuerySchema.parse({ limit: '366' })).toThrow();
    expect(() =>
      WeightHistoryQuerySchema.parse({ from: '2026-08-01', to: '2026-07-01' }),
    ).toThrow();
  });

  it('validates the response DTO', () => {
    expect(
      WeightLogSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        loggedOn: '2026-07-30',
        weightKg: 81.4,
        bodyFatPct: null,
        notes: null,
        createdAt: '2026-07-30T06:00:00.000Z',
        updatedAt: '2026-07-30T06:00:00.000Z',
      }).weightKg,
    ).toBe(81.4);
  });
});
