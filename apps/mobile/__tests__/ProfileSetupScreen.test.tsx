import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { ProfileSetupScreen } from '../src/screens/profile/ProfileSetupScreen';
import { RootStore } from '../src/stores/RootStore';
import { StoresProvider } from '../src/stores/StoresContext';
import { createInMemoryStorage } from '../src/services/secureStorage';

const sampleUser = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'a@b.io',
  displayName: 'Jane',
  locale: 'en' as const,
  gender: 'female' as const,
  birthDate: '1990-04-15',
  heightCm: 165,
};

const buildStore = (overrides?: { put?: jest.Mock; user?: typeof sampleUser | null }) => {
  const put = overrides?.put ?? jest.fn();
  const api = {
    get: jest.fn(),
    post: jest.fn(),
    put,
    patch: jest.fn(),
  } as unknown as import('axios').AxiosInstance;
  const store = new RootStore({
    baseURL: 'http://x',
    storage: createInMemoryStorage(),
    setI18nLanguage: jest.fn(),
    setRtl: jest.fn(),
    api,
  });
  if (overrides?.user !== null) store.auth.setUser(overrides?.user ?? sampleUser);
  return { store, put };
};

const wrap = (store: RootStore, ui: React.ReactNode) => (
  <StoresProvider store={store}>
    <I18nProvider locale="en">{ui}</I18nProvider>
  </StoresProvider>
);

describe('ProfileSetupScreen', () => {
  it('blocks submit and shows error when weight is invalid', () => {
    const { store, put } = buildStore();
    const { getByTestId } = render(wrap(store, <ProfileSetupScreen />));
    fireEvent.changeText(getByTestId('setup-weight'), 'abc');
    fireEvent.press(getByTestId('setup-submit'));
    expect(put).not.toHaveBeenCalled();
    expect(getByTestId('setup-weight-error')).toBeTruthy();
  });

  it('rejects an invalid optional goal weight', () => {
    const { store, put } = buildStore();
    const { getByTestId } = render(wrap(store, <ProfileSetupScreen />));
    fireEvent.changeText(getByTestId('setup-weight'), '70');
    fireEvent.changeText(getByTestId('setup-goalWeight'), '5');
    fireEvent.press(getByTestId('setup-submit'));
    expect(put).not.toHaveBeenCalled();
    expect(getByTestId('setup-goalWeight-error')).toBeTruthy();
  });

  it('submits a valid metrics payload', async () => {
    const put = jest.fn().mockResolvedValueOnce({
      data: {
        profile: sampleUser,
        metrics: {
          currentWeightKg: 70,
          activityLevel: 'moderate',
          goalType: 'maintain',
          goalWeightKg: null,
          dietaryRestrictions: {},
        },
        derived: { ageYears: 35, bmi: 23.9, bmrKcal: 1370.3, tdeeKcal: 2124, targetKcal: 2124 },
      },
    });
    const { store } = buildStore({ put });
    const { getByTestId } = render(wrap(store, <ProfileSetupScreen />));
    fireEvent.changeText(getByTestId('setup-weight'), '70');
    fireEvent.press(getByTestId('setup-submit'));
    await Promise.resolve();
    expect(put).toHaveBeenCalledWith(
      '/api/v1/users/me/metrics',
      expect.objectContaining({ currentWeightKg: 70, activityLevel: 'moderate', goalType: 'maintain' }),
    );
  });

  it('does not submit when there is no current user (defensive)', () => {
    const put = jest.fn();
    const api = { get: jest.fn(), post: jest.fn(), put, patch: jest.fn() } as unknown as import('axios').AxiosInstance;
    const store = new RootStore({
      baseURL: 'http://x',
      storage: createInMemoryStorage(),
      setI18nLanguage: jest.fn(),
      setRtl: jest.fn(),
      api,
    });
    const { getByTestId } = render(wrap(store, <ProfileSetupScreen />));
    fireEvent.changeText(getByTestId('setup-weight'), '70');
    fireEvent.press(getByTestId('setup-submit'));
    expect(put).not.toHaveBeenCalled();
  });

  it('lets the user change activity and goal via segmented pickers', () => {
    const { store } = buildStore();
    const { getByTestId } = render(wrap(store, <ProfileSetupScreen />));
    fireEvent.press(getByTestId('setup-activity-high'));
    fireEvent.press(getByTestId('setup-goal-lose'));
    expect(getByTestId('setup-activity-high')).toBeTruthy();
    expect(getByTestId('setup-goal-lose')).toBeTruthy();
  });
});
