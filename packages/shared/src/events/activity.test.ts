import { SharedActivityCreatedEventSchema } from './activity.js';

describe('shared activity socket events', () => {
  it('contains only the safe persisted activity DTO', () => {
    const event = SharedActivityCreatedEventSchema.parse({
      activity: {
        id: '00000000-0000-4000-8000-000000000001',
        coupleId: '00000000-0000-4000-8000-000000000002',
        actor: {
          userId: '00000000-0000-4000-8000-000000000003',
          displayName: 'Jane',
        },
        kind: 'movement',
        note: null,
        createdAt: '2026-07-30T09:00:00.000Z',
      },
    });

    expect(event.activity.kind).toBe('movement');
    expect(event.activity).not.toHaveProperty('weightKg');
  });
});
