import type { WeightLog } from '@fitnessapp/shared';
import { createProgressService } from './service.js';
import type { ProgressRepo } from './repo.js';

const log: WeightLog = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  loggedOn: '2026-07-30',
  weightKg: 81.4,
  bodyFatPct: null,
  notes: null,
  createdAt: '2026-07-30T06:00:00.000Z',
  updatedAt: '2026-07-30T06:00:00.000Z',
};

const buildRepo = (overrides: Partial<ProgressRepo> = {}): ProgressRepo =>
  ({
    getProgramStartedOn: jest.fn().mockResolvedValue('2026-04-01'),
    upsertWeightLog: jest.fn().mockResolvedValue(log),
    listWeightLogs: jest.fn().mockResolvedValue([log]),
    ...overrides,
  }) as ProgressRepo;

describe('progress service', () => {
  it('uses the Israel calendar date when the client omits loggedOn', async () => {
    const repo = buildRepo();
    const service = createProgressService({ repo, today: () => '2026-07-30' });

    await expect(service.logWeight('user-id', { weightKg: 81.4 })).resolves.toEqual(log);
    expect(repo.upsertWeightLog).toHaveBeenCalledWith('user-id', {
      loggedOn: '2026-07-30',
      weightKg: 81.4,
      bodyFatPct: null,
      notes: null,
    });
  });

  it('preserves an explicitly supplied date and optional measurements', async () => {
    const repo = buildRepo();
    const service = createProgressService({ repo, today: () => '2026-07-30' });

    await service.logWeight('user-id', {
      loggedOn: '2026-07-28',
      weightKg: 82,
      bodyFatPct: 20,
      notes: 'After waking',
    });

    expect(repo.upsertWeightLog).toHaveBeenCalledWith('user-id', {
      loggedOn: '2026-07-28',
      weightKg: 82,
      bodyFatPct: 20,
      notes: 'After waking',
    });
  });

  it('rejects measurements dated in the future', async () => {
    const repo = buildRepo();
    const service = createProgressService({ repo, today: () => '2026-07-30' });

    await expect(
      service.logWeight('user-id', {
        loggedOn: '2026-07-31',
        weightKg: 82,
      }),
    ).resolves.toEqual({ kind: 'future_date' });
    expect(repo.upsertWeightLog).not.toHaveBeenCalled();
  });

  it('blocks weight logging until the 13-week foundation program is completed', async () => {
    const repo = buildRepo({
      getProgramStartedOn: jest.fn().mockResolvedValue('2026-07-01'),
    });
    const service = createProgressService({ repo, today: () => '2026-07-30' });

    await expect(service.logWeight('user-id', { weightKg: 81.4 })).resolves.toEqual({
      kind: 'maintenance_only',
    });
    expect(repo.upsertWeightLog).not.toHaveBeenCalled();
  });

  it('blocks weight history before the foundation program is completed', async () => {
    const repo = buildRepo({
      getProgramStartedOn: jest.fn().mockResolvedValue(null),
    });
    const service = createProgressService({ repo, today: () => '2026-07-30' });

    await expect(service.getWeightHistory('user-id', { limit: 30 })).resolves.toEqual({
      kind: 'maintenance_only',
    });
    expect(repo.listWeightLogs).not.toHaveBeenCalled();
  });

  it('returns bounded private history from the repository', async () => {
    const repo = buildRepo();
    const service = createProgressService({ repo });

    await expect(
      service.getWeightHistory('user-id', {
        from: '2026-07-01',
        to: '2026-07-30',
        limit: 30,
      }),
    ).resolves.toEqual({ logs: [log] });
    expect(repo.listWeightLogs).toHaveBeenCalledWith('user-id', {
      from: '2026-07-01',
      to: '2026-07-30',
      limit: 30,
    });
  });
});
