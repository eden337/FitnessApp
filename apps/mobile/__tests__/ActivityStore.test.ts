import type { AxiosInstance } from 'axios';
import type { SharedActivity } from '@fitnessapp/shared';
import { ActivityStore } from '../src/stores/ActivityStore';

const activity: SharedActivity = {
  id: '00000000-0000-4000-8000-000000000001',
  coupleId: '00000000-0000-4000-8000-000000000002',
  actor: {
    userId: '00000000-0000-4000-8000-000000000003',
    displayName: 'Jane',
  },
  kind: 'hydration',
  note: null,
  createdAt: '2026-07-30T09:00:00.000Z',
};

describe('ActivityStore', () => {
  it('fetches the bounded couple feed', async () => {
    const get = jest.fn().mockResolvedValue({ data: { activities: [activity] } });
    const store = new ActivityStore({ api: { get } as unknown as AxiosInstance });

    await store.fetch();

    expect(get).toHaveBeenCalledWith('/api/v1/progress/feed', {
      params: { limit: 30 },
    });
    expect(store.activities).toEqual([activity]);
    expect(store.status).toBe('ready');
  });

  it('shares a safe win and deduplicates it into the feed', async () => {
    const post = jest.fn().mockResolvedValue({ data: activity });
    const store = new ActivityStore({ api: { post } as unknown as AxiosInstance });
    store.activities = [activity];

    const shared = await store.share({ kind: 'hydration' });

    expect(post).toHaveBeenCalledWith('/api/v1/progress/activities', {
      kind: 'hydration',
    });
    expect(shared).toBe(true);
    expect(store.activities).toEqual([activity]);
  });

  it('reports failures and resets private local state', async () => {
    const get = jest.fn().mockRejectedValue(new Error('offline'));
    const store = new ActivityStore({ api: { get } as unknown as AxiosInstance });

    await store.fetch();
    expect(store.status).toBe('error');

    store.reset();
    expect(store.activities).toEqual([]);
    expect(store.status).toBe('idle');
    expect(store.errorMessage).toBeNull();
  });
});
