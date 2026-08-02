import {
  CreateSharedActivityInputSchema,
  SharedActivityFeedQuerySchema,
  SharedActivitySchema,
} from './activity.js';

describe('shared activity schemas', () => {
  it('accepts only the privacy-safe activity whitelist', () => {
    expect(CreateSharedActivityInputSchema.parse({ kind: 'hydration' })).toEqual({
      kind: 'hydration',
    });
    expect(() =>
      CreateSharedActivityInputSchema.parse({ kind: 'weight_loss' }),
    ).toThrow();
    expect(() =>
      CreateSharedActivityInputSchema.parse({
        kind: 'movement',
        note: 'x'.repeat(161),
      }),
    ).toThrow();
  });

  it('bounds and coerces reconciliation queries', () => {
    expect(SharedActivityFeedQuerySchema.parse({ limit: '20' })).toEqual({
      limit: 20,
    });
    expect(() => SharedActivityFeedQuerySchema.parse({ limit: '101' })).toThrow();
    expect(() => SharedActivityFeedQuerySchema.parse({ since: 'yesterday' })).toThrow();
  });

  it('contains public actor identity without private body fields', () => {
    const activity = SharedActivitySchema.parse({
      id: '00000000-0000-4000-8000-000000000001',
      coupleId: '00000000-0000-4000-8000-000000000002',
      actor: {
        userId: '00000000-0000-4000-8000-000000000003',
        displayName: 'Alex',
      },
      kind: 'vegetables',
      note: null,
      createdAt: '2026-07-30T09:00:00.000Z',
    });

    expect(activity.actor.displayName).toBe('Alex');
    expect(activity).not.toHaveProperty('weightKg');
    expect(activity.actor).not.toHaveProperty('email');
  });
});
