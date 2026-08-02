import type {
  CurrentProgramResponse,
  FoodListsResponse,
  ProgramStatus,
  StartProgramInput,
} from '@fitnessapp/shared';
import { todayInIsrael } from '../../lib/israel-date.js';
import type { ProgramRepo } from './repo.js';

const PROGRAM_VERSION = 'v1';
const DAY_MS = 86_400_000;

export type ProgramProgress = {
  status: ProgramStatus;
  scheduledWeekNumber: number;
  contentWeekNumber: number;
  isFallback: boolean;
};

const parseDate = (date: string): number => Date.parse(`${date}T00:00:00.000Z`);
const formatDate = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 10);

export const calculateProgramProgress = (
  startedOn: string | null,
  today: string,
): ProgramProgress => {
  if (!startedOn) {
    return {
      status: 'not_started',
      scheduledWeekNumber: 1,
      contentWeekNumber: 1,
      isFallback: false,
    };
  }
  const elapsedDays = Math.max(0, Math.floor((parseDate(today) - parseDate(startedOn)) / DAY_MS));
  const rawWeek = Math.floor(elapsedDays / 7) + 1;
  const scheduledWeekNumber = Math.min(rawWeek, 13);
  const contentWeekNumber = scheduledWeekNumber === 11 ? 10 : scheduledWeekNumber;
  return {
    status: rawWeek > 13 ? 'completed' : 'active',
    scheduledWeekNumber,
    contentWeekNumber,
    isFallback: scheduledWeekNumber === 11,
  };
};

const rebaseStartDate = (today: string, currentWeekNumber: number): string =>
  formatDate(parseDate(today) - (currentWeekNumber - 1) * 7 * DAY_MS);

export const createProgramService = (deps: {
  repo: ProgramRepo;
  today?: () => string;
}) => {
  const { repo } = deps;
  const today = deps.today ?? (() => todayInIsrael());

  const responseFor = async (
    startedOn: string | null,
  ): Promise<CurrentProgramResponse> => {
    const progress = calculateProgramProgress(startedOn, today());
    const week = await repo.getWeekWithTasks(PROGRAM_VERSION, progress.contentWeekNumber);
    if (!week) throw new Error(`program week ${progress.contentWeekNumber} is not seeded`);
    return { ...progress, startedOn, week };
  };

  return {
    async getCurrent(userId: string): Promise<CurrentProgramResponse> {
      return responseFor(await repo.getStartedOn(userId));
    },

    async start(
      userId: string,
      input: StartProgramInput,
    ): Promise<CurrentProgramResponse | { kind: 'already_started' | 'missing_metrics' }> {
      const startedOn = rebaseStartDate(today(), input.currentWeekNumber);
      const result = await repo.setStartedOnIfNull(userId, startedOn);
      if (result !== 'started') return { kind: result };
      return responseFor(startedOn);
    },

    async getFoodLists(userId: string, weekNumber?: number): Promise<FoodListsResponse> {
      const progress =
        weekNumber === undefined
          ? calculateProgramProgress(await repo.getStartedOn(userId), today())
          : {
              scheduledWeekNumber: weekNumber,
              contentWeekNumber: weekNumber === 11 ? 10 : weekNumber,
            };
      const lists = await repo.getFoodLists(PROGRAM_VERSION, progress.contentWeekNumber);
      return {
        scheduledWeekNumber: progress.scheduledWeekNumber,
        contentWeekNumber: progress.contentWeekNumber,
        lists,
      };
    },
  };
};

export type ProgramService = ReturnType<typeof createProgramService>;
