import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { AxiosInstance } from 'axios';
import type { WeightLog } from '@fitnessapp/shared';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { ProgressScreen } from '../src/screens/progress/ProgressScreen';
import { createInMemoryStorage } from '../src/services/secureStorage';
import { RootStore } from '../src/stores/RootStore';
import { StoresProvider } from '../src/stores/StoresContext';

const weightLog: WeightLog = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  loggedOn: '2026-07-30',
  weightKg: 81.4,
  bodyFatPct: 20.5,
  notes: 'Morning',
  createdAt: '2026-07-30T06:00:00.000Z',
  updatedAt: '2026-07-30T06:00:00.000Z',
};

const buildStore = () => {
  const post = jest.fn().mockResolvedValue({ data: weightLog });
  const get = jest.fn().mockResolvedValue({
    data: { profile: null, metrics: null, derived: null },
  });
  const api = { get, post } as unknown as AxiosInstance;
  const store = new RootStore({
    baseURL: 'http://x',
    storage: createInMemoryStorage(),
    setI18nLanguage: jest.fn(),
    setRtl: jest.fn(),
    initialLocale: 'en',
    api,
  });
  return { store, post };
};

describe('ProgressScreen', () => {
  it('shows private history and submits a valid weight', async () => {
    const { store, post } = buildStore();
    store.progress.logs = [weightLog];
    store.progress.status = 'ready';
    const { getByText, getByTestId } = render(
      <StoresProvider store={store}>
        <I18nProvider locale="en">
          <ProgressScreen />
        </I18nProvider>
      </StoresProvider>,
    );

    expect(getByText('81.4 kg')).toBeTruthy();
    expect(getByText('Only you can see these measurements.')).toBeTruthy();

    fireEvent.changeText(getByTestId('progress-weight-input'), '81.4');
    fireEvent.changeText(getByTestId('progress-date-input'), '2026-07-30');
    fireEvent.press(getByTestId('progress-save'));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/v1/progress/weight', {
        loggedOn: '2026-07-30',
        weightKg: 81.4,
      }),
    );
  });

  it('rejects an out-of-range measurement before making a request', () => {
    const { store, post } = buildStore();
    const { getByTestId } = render(
      <StoresProvider store={store}>
        <I18nProvider locale="en">
          <ProgressScreen />
        </I18nProvider>
      </StoresProvider>,
    );

    fireEvent.changeText(getByTestId('progress-weight-input'), '500');
    fireEvent.press(getByTestId('progress-save'));

    expect(getByTestId('progress-weight-input-error')).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });
});
