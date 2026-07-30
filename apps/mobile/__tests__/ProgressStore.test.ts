import type { AxiosInstance } from 'axios';
import type { WeightLog } from '@fitnessapp/shared';
import { ProgressStore } from '../src/stores/ProgressStore';

const log = (overrides: Partial<WeightLog> = {}): WeightLog => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  loggedOn: '2026-07-30',
  weightKg: 81.4,
  bodyFatPct: null,
  notes: null,
  createdAt: '2026-07-30T06:00:00.000Z',
  updatedAt: '2026-07-30T06:00:00.000Z',
  ...overrides,
});

const build = () => {
  const get = jest.fn().mockResolvedValue({ data: { logs: [log()] } });
  const post = jest.fn();
  const afterLog = jest.fn().mockResolvedValue(undefined);
  const api = { get, post } as unknown as AxiosInstance;
  return { store: new ProgressStore({ api, afterLog }), get, post, afterLog };
};

describe('ProgressStore', () => {
  it('fetches private weight history', async () => {
    const { store, get } = build();

    await store.fetch();

    expect(get).toHaveBeenCalledWith('/api/v1/progress/weight');
    expect(store.logs).toHaveLength(1);
    expect(store.status).toBe('ready');
  });

  it('logs weight, replaces the same date, and refreshes profile metrics', async () => {
    const { store, post, afterLog } = build();
    store.logs = [log({ weightKg: 82 })];
    post.mockResolvedValueOnce({ data: log({ weightKg: 81.2 }) });

    await expect(
      store.logWeight({ loggedOn: '2026-07-30', weightKg: 81.2 }),
    ).resolves.toBe(true);

    expect(post).toHaveBeenCalledWith('/api/v1/progress/weight', {
      loggedOn: '2026-07-30',
      weightKg: 81.2,
    });
    expect(store.logs).toHaveLength(1);
    expect(store.logs[0]?.weightKg).toBe(81.2);
    expect(afterLog).toHaveBeenCalled();
  });

  it('surfaces errors and resets state', async () => {
    const { store, get } = build();
    get.mockRejectedValueOnce({
      response: { data: { error: { code: 'progress_unavailable' } } },
    });

    await store.fetch();
    expect(store.errorMessage).toBe('progress_unavailable');

    store.reset();
    expect(store.logs).toEqual([]);
    expect(store.status).toBe('idle');
  });
});
