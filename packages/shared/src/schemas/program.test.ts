import {
  CurrentProgramResponseSchema,
  FoodItemSchema,
  FoodListsResponseSchema,
  StartProgramInputSchema,
} from './program.js';

const week = {
  id: '00000000-0000-4000-8000-000000000001',
  weekNumber: 10,
  slug: 'leptin-deepening-1',
  title: { he: 'שבוע 10', en: 'Week 10' },
  mission: { he: 'משימה', en: 'Mission' },
  rationale: { he: 'סיבה', en: 'Reason' },
  notes: null,
  tasks: [
    {
      id: '00000000-0000-4000-8000-000000000002',
      ordinal: 0,
      kind: 'required',
      title: { he: 'ללכת', en: 'Walk' },
      description: null,
    },
  ],
};

describe('program schemas', () => {
  it('accepts a current-program week-11 fallback response', () => {
    expect(
      CurrentProgramResponseSchema.parse({
        status: 'active',
        startedOn: '2026-05-20',
        scheduledWeekNumber: 11,
        contentWeekNumber: 10,
        isFallback: true,
        week,
      }),
    ).toEqual(expect.objectContaining({ isFallback: true }));
  });

  it('accepts not-started preview and completed states', () => {
    expect(
      CurrentProgramResponseSchema.parse({
        status: 'not_started',
        startedOn: null,
        scheduledWeekNumber: 1,
        contentWeekNumber: 1,
        isFallback: false,
        week: { ...week, weekNumber: 1 },
      }).status,
    ).toBe('not_started');
    expect(
      CurrentProgramResponseSchema.parse({
        status: 'completed',
        startedOn: '2026-01-01',
        scheduledWeekNumber: 13,
        contentWeekNumber: 13,
        isFallback: false,
        week: { ...week, weekNumber: 13 },
      }).status,
    ).toBe('completed');
  });

  it('validates starting week and rejects unknown input fields', () => {
    expect(StartProgramInputSchema.parse({ currentWeekNumber: 7 })).toEqual({
      currentWeekNumber: 7,
    });
    expect(() => StartProgramInputSchema.parse({ currentWeekNumber: 0 })).toThrow();
    expect(() =>
      StartProgramInputSchema.parse({ currentWeekNumber: 1, startedOn: '2020-01-01' }),
    ).toThrow();
  });

  it('validates ordered food-list DTOs', () => {
    expect(
      FoodListsResponseSchema.parse({
        scheduledWeekNumber: 3,
        contentWeekNumber: 3,
        lists: [
          {
            id: '00000000-0000-4000-8000-000000000003',
            slug: 'proteins',
            name: { he: 'חלבונים', en: 'Proteins' },
            description: null,
            weekNumber: null,
            items: [],
          },
        ],
      }).lists,
    ).toHaveLength(1);
  });

  it('requires a supported food visual key', () => {
    const item = {
      id: '00000000-0000-4000-8000-000000000004',
      ordinal: 0,
      visualKey: 'apple',
      name: { he: 'תפוח', en: 'Apple' },
      portion: null,
      notes: null,
    };

    expect(FoodItemSchema.parse(item).visualKey).toBe('apple');
    expect(() => FoodItemSchema.parse({ ...item, visualKey: 'unknown-food-art' })).toThrow();
  });
});
