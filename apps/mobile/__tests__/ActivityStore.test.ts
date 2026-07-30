import type { AxiosInstance } from 'axios';
import { SOCKET_EVENTS, type SharedActivity } from '@fitnessapp/shared';
import { waitFor } from '@testing-library/react-native';
import type { Socket } from 'socket.io-client';
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

  it('merges realtime events and reconciles from the persisted cursor', async () => {
    const newer = {
      ...activity,
      id: '00000000-0000-4000-8000-000000000004',
      kind: 'movement' as const,
      createdAt: '2026-07-30T10:00:00.000Z',
    };
    const get = jest.fn().mockResolvedValue({ data: { activities: [activity, newer] } });
    const store = new ActivityStore({ api: { get } as unknown as AxiosInstance });
    store.activities = [activity];
    store.status = 'ready';
    const handlers = new Map<string, (payload: unknown) => void>();
    const socket = {
      connected: false,
      on: jest.fn((event: string, handler: (payload: unknown) => void) => {
        handlers.set(event, handler);
      }),
      off: jest.fn(),
    } as unknown as Socket;

    store.bindSocket(socket);
    handlers.get(SOCKET_EVENTS.activityCreated)?.({ activity: { weightKg: 70 } });
    expect(store.activities).toEqual([activity]);
    handlers.get(SOCKET_EVENTS.activityCreated)?.({ activity: newer });
    expect(store.activities.map((item) => item.id)).toEqual([newer.id, activity.id]);

    handlers.get('connect')?.(undefined);
    await waitFor(() => {
      expect(get).toHaveBeenCalledWith('/api/v1/progress/feed', {
        params: { since: newer.createdAt, limit: 100 },
      });
    });
    expect(store.activities.map((item) => item.id)).toEqual([newer.id, activity.id]);

    store.unbindSocket();
    expect(socket.off).toHaveBeenCalledWith(
      SOCKET_EVENTS.activityCreated,
      store.onActivityCreated,
    );
  });
});
