import type { FoodList, ProgramWeek } from '@fitnessapp/shared';
import { calculateProgramProgress, createProgramService } from './service.js';
import type { ProgramRepo } from './repo.js';

const week = (weekNumber: number): ProgramWeek => ({
  id: `00000000-0000-4000-8000-${String(weekNumber).padStart(12, '0')}`,
  weekNumber,
  slug: `week-${weekNumber}`,
  title: { he: `שבוע ${weekNumber}`, en: `Week ${weekNumber}` },
  mission: { he: 'משימה', en: 'Mission' },
  rationale: null,
  notes: null,
  tasks: [],
});

const buildRepo = (): jest.Mocked<ProgramRepo> =>
  ({
    getStartedOn: jest.fn(),
    setStartedOnIfNull: jest.fn(),
    getWeekWithTasks: jest.fn(async (_version, weekNumber) => week(weekNumber)),
    getFoodLists: jest.fn(async (_version: string, _weekNumber: number) => [] as FoodList[]),
  }) as unknown as jest.Mocked<ProgramRepo>;

describe('program service', () => {
  it('previews week 1 before the program starts', async () => {
    const repo = buildRepo();
    repo.getStartedOn.mockResolvedValue(null);
    const service = createProgramService({ repo, today: () => '2026-07-29' });

    await expect(service.getCurrent('user-1')).resolves.toEqual(
      expect.objectContaining({
        status: 'not_started',
        startedOn: null,
        scheduledWeekNumber: 1,
        contentWeekNumber: 1,
        isFallback: false,
      }),
    );
  });

  it('serves week 10 as an explicit fallback during scheduled week 11', async () => {
    const repo = buildRepo();
    repo.getStartedOn.mockResolvedValue('2026-05-20');
    const service = createProgramService({ repo, today: () => '2026-07-29' });

    const result = await service.getCurrent('user-1');

    expect(result).toEqual(
      expect.objectContaining({
        status: 'active',
        scheduledWeekNumber: 11,
        contentWeekNumber: 10,
        isFallback: true,
      }),
    );
    expect(repo.getWeekWithTasks).toHaveBeenCalledWith('v1', 10);
  });

  it('keeps week 13 content and marks the program completed after 13 weeks', () => {
    expect(calculateProgramProgress('2026-04-01', '2026-07-29')).toEqual({
      status: 'completed',
      scheduledWeekNumber: 13,
      contentWeekNumber: 13,
      isFallback: false,
    });
  });

  it('rebases a selected current week and prevents an accidental restart', async () => {
    const repo = buildRepo();
    repo.setStartedOnIfNull.mockResolvedValueOnce('started');
    repo.getStartedOn.mockResolvedValueOnce('2026-06-17');
    const service = createProgramService({ repo, today: () => '2026-07-29' });

    const result = await service.start('user-1', { currentWeekNumber: 7 });

    expect(repo.setStartedOnIfNull).toHaveBeenCalledWith('user-1', '2026-06-17');
    expect(result).toEqual(expect.objectContaining({ scheduledWeekNumber: 7 }));

    repo.setStartedOnIfNull.mockResolvedValueOnce('already_started');
    await expect(service.start('user-1', { currentWeekNumber: 1 })).resolves.toEqual({
      kind: 'already_started',
    });
  });

  it('returns missing metrics when no user_metrics row can be started', async () => {
    const repo = buildRepo();
    repo.setStartedOnIfNull.mockResolvedValue('missing_metrics');
    const service = createProgramService({ repo, today: () => '2026-07-29' });

    await expect(service.start('user-1', { currentWeekNumber: 1 })).resolves.toEqual({
      kind: 'missing_metrics',
    });
  });

  it('returns global and effective-week lists for explicit week 11', async () => {
    const repo = buildRepo();
    const service = createProgramService({ repo, today: () => '2026-07-29' });

    const result = await service.getFoodLists('user-1', 11);

    expect(result).toEqual({
      scheduledWeekNumber: 11,
      contentWeekNumber: 10,
      lists: [],
    });
    expect(repo.getFoodLists).toHaveBeenCalledWith('v1', 10);
  });
});
