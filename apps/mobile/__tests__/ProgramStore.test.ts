import type { AxiosInstance } from 'axios';
import type { CurrentProgramResponse, FoodListsResponse } from '@fitnessapp/shared';
import { ProgramStore } from '../src/stores/ProgramStore';

const current: CurrentProgramResponse = {
  status: 'not_started',
  startedOn: null,
  scheduledWeekNumber: 1,
  contentWeekNumber: 1,
  isFallback: false,
  week: {
    id: '00000000-0000-4000-8000-000000000001',
    weekNumber: 1,
    slug: 'week-1',
    title: { he: 'שבוע 1', en: 'Week 1' },
    mission: { he: 'משימה', en: 'Mission' },
    rationale: null,
    notes: null,
    tasks: [],
  },
};

const lists: FoodListsResponse = {
  scheduledWeekNumber: 1,
  contentWeekNumber: 1,
  lists: [],
};

const build = () => {
  const get = jest
    .fn()
    .mockResolvedValueOnce({ data: current })
    .mockResolvedValueOnce({ data: lists });
  const post = jest.fn();
  const api = { get, post } as unknown as AxiosInstance;
  return { store: new ProgramStore({ api }), get, post };
};

describe('ProgramStore', () => {
  it('fetches current guidance and applicable lists', async () => {
    const { store, get } = build();

    await store.fetch();

    expect(get).toHaveBeenNthCalledWith(1, '/api/v1/program/me/current');
    expect(get).toHaveBeenNthCalledWith(2, '/api/v1/program/lists');
    expect(store.current?.week.weekNumber).toBe(1);
    expect(store.status).toBe('ready');
  });

  it('starts from a selected week and refreshes lists', async () => {
    const { store, post, get } = build();
    post.mockResolvedValueOnce({
      data: { ...current, status: 'active', startedOn: '2026-07-29', scheduledWeekNumber: 7 },
    });
    get.mockReset().mockResolvedValueOnce({
      data: { ...lists, scheduledWeekNumber: 7, contentWeekNumber: 7 },
    });

    await expect(store.start(7)).resolves.toBe(true);

    expect(post).toHaveBeenCalledWith('/api/v1/program/me/start', {
      currentWeekNumber: 7,
    });
    expect(store.current?.scheduledWeekNumber).toBe(7);
    expect(store.listsStatus).toBe('ready');
  });

  it('preserves a successful start when refreshing lists fails', async () => {
    const { store, post, get } = build();
    post.mockResolvedValueOnce({
      data: { ...current, status: 'active', startedOn: '2026-07-29', scheduledWeekNumber: 7 },
    });
    get.mockReset().mockRejectedValueOnce(new Error('offline'));

    await expect(store.start(7)).resolves.toBe(true);

    expect(store.current?.status).toBe('active');
    expect(store.current?.scheduledWeekNumber).toBe(7);
    expect(store.status).toBe('ready');
    expect(store.listsStatus).toBe('error');
    expect(store.listsErrorMessage).toBeTruthy();
  });

  it('retries only the food-list refresh after a partial start success', async () => {
    const { store, post, get } = build();
    post.mockResolvedValueOnce({
      data: { ...current, status: 'active', startedOn: '2026-07-29' },
    });
    get
      .mockReset()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: lists });

    await store.start(1);
    await expect(store.refreshLists()).resolves.toBe(true);

    expect(post).toHaveBeenCalledTimes(1);
    expect(store.listsStatus).toBe('ready');
    expect(store.listsErrorMessage).toBeNull();
  });

  it('enters loading immediately and leaves the program unstarted when POST fails', async () => {
    const { store, post } = build();
    let rejectPost!: (reason: unknown) => void;
    post.mockReturnValueOnce(new Promise((_, reject) => {
      rejectPost = reject;
    }));

    const result = store.start(1);
    expect(store.status).toBe('loading');
    rejectPost(new Error('offline'));

    await expect(result).resolves.toBe(false);
    expect(store.current).toBeNull();
    expect(store.status).toBe('error');
  });

  it('surfaces server errors and resets all state', async () => {
    const { store, get } = build();
    get.mockReset().mockRejectedValueOnce({
      response: { data: { error: { code: 'program_unavailable' } } },
    });

    await store.fetch();
    expect(store.status).toBe('error');
    expect(store.errorMessage).toBe('program_unavailable');

    store.reset();
    expect(store.current).toBeNull();
    expect(store.lists).toEqual([]);
    expect(store.status).toBe('idle');
    expect(store.listsStatus).toBe('idle');
  });
});
