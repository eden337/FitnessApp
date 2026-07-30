import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { CurrentProgramResponse } from '@fitnessapp/shared';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { createInMemoryStorage } from '../src/services/secureStorage';
import { TodayScreen } from '../src/screens/program/TodayScreen';
import { RootStore } from '../src/stores/RootStore';
import { StoresProvider } from '../src/stores/StoresContext';

const current = (status: CurrentProgramResponse['status']): CurrentProgramResponse => ({
  status,
  startedOn: status === 'not_started' ? null : '2026-07-29',
  scheduledWeekNumber: 3,
  contentWeekNumber: 3,
  isFallback: false,
  week: {
    id: '00000000-0000-4000-8000-000000000001',
    weekNumber: 3,
    slug: 'week-3',
    title: { he: 'שבוע 3', en: 'Week 3' },
    mission: { he: 'משימה בעברית', en: 'Eat vegetables first' },
    rationale: { he: 'סיבה', en: 'Why it matters' },
    notes: { he: 'הערה', en: 'A useful note' },
    tasks: [
      {
        id: '00000000-0000-4000-8000-000000000002',
        ordinal: 0,
        kind: 'required',
        title: { he: 'משימה', en: 'Drink water' },
        description: null,
      },
    ],
  },
});

const buildStore = () =>
  new RootStore({
    baseURL: 'http://x',
    storage: createInMemoryStorage(),
    setI18nLanguage: jest.fn(),
    setRtl: jest.fn(),
    initialLocale: 'en',
    api: { get: jest.fn(), post: jest.fn() } as never,
  });

const renderScreen = (store: RootStore, ui: React.ReactNode) =>
  render(
    <StoresProvider store={store}>
      <I18nProvider locale="en">{ui}</I18nProvider>
    </StoresProvider>,
  );

describe('TodayScreen', () => {
  it('renders localized weekly guidance and read-only tasks', () => {
    const store = buildStore();
    store.program.current = current('active');

    const { getByText, getByTestId } = renderScreen(store, <TodayScreen />);

    expect(getByTestId('program-today-screen')).toBeTruthy();
    expect(getByTestId('today-mission-hero')).toBeTruthy();
    expect(getByTestId('today-task-0')).toBeTruthy();
    expect(getByText('Week 3')).toBeTruthy();
    expect(getByText('Eat vegetables first')).toBeTruthy();
    expect(getByText('Drink water')).toBeTruthy();
  });

  it('lets an existing participant choose a resume week before starting', async () => {
    const store = buildStore();
    store.program.current = { ...current('not_started'), scheduledWeekNumber: 1 };
    const start = jest.spyOn(store.program, 'start').mockResolvedValue(true);

    const { getByTestId } = renderScreen(store, <TodayScreen />);
    fireEvent.press(getByTestId('program-week-picker-7'));
    fireEvent.press(getByTestId('program-start'));

    await waitFor(() => expect(start).toHaveBeenCalledWith(7));
  });

  it('labels the week-11 fallback explicitly', () => {
    const store = buildStore();
    store.program.current = {
      ...current('active'),
      scheduledWeekNumber: 11,
      contentWeekNumber: 10,
      isFallback: true,
    };

    const { getByTestId } = renderScreen(store, <TodayScreen />);
    expect(getByTestId('program-fallback')).toBeTruthy();
  });

  it('offers a list-only retry without losing the active program', async () => {
    const store = buildStore();
    store.program.current = current('active');
    store.program.listsStatus = 'error';
    const refreshLists = jest.spyOn(store.program, 'refreshLists').mockResolvedValue(true);

    const { getByTestId } = renderScreen(store, <TodayScreen />);
    expect(getByTestId('program-lists-refresh-error')).toBeTruthy();
    fireEvent.press(getByTestId('program-lists-refresh-retry'));

    await waitFor(() => expect(refreshLists).toHaveBeenCalledTimes(1));
    expect(store.program.current?.status).toBe('active');
  });
});
