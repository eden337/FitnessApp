import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { HomeScreen } from '../src/screens/HomeScreen';
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

const buildStore = () => {
  const post = jest.fn().mockResolvedValue({ data: {} });
  const api = {
    get: jest.fn(),
    post,
    put: jest.fn(),
    patch: jest.fn(),
  } as unknown as import('axios').AxiosInstance;
  return {
    post,
    store: new RootStore({
      baseURL: 'http://x',
      storage: createInMemoryStorage(),
      setI18nLanguage: jest.fn(),
      setRtl: jest.fn(),
      api,
    }),
  };
};

const wrap = (store: RootStore, ui: React.ReactNode) => (
  <StoresProvider store={store}>
    <I18nProvider locale="en">{ui}</I18nProvider>
  </StoresProvider>
);

describe('HomeScreen', () => {
  it('shows the needs-setup hint when metrics are absent', () => {
    const { store } = buildStore();
    store.auth.setUser(sampleUser);
    const { getByTestId } = render(wrap(store, <HomeScreen />));
    expect(getByTestId('home-empty')).toBeTruthy();
  });

  it('shows program momentum without exposing private body metrics', () => {
    const { store } = buildStore();
    store.auth.setUser(sampleUser);
    store.profile.profile = sampleUser;
    store.profile.metrics = {
      currentWeightKg: 65,
      activityLevel: 'moderate',
      goalType: 'lose',
      goalWeightKg: 60,
      dietaryRestrictions: {},
    };
    store.profile.derived = { ageYears: 35, bmi: 23.9, bmrKcal: 1370.3, tdeeKcal: 2124, targetKcal: 1624 };
    const { queryByText, getByTestId } = render(wrap(store, <HomeScreen />));
    expect(getByTestId('home-momentum-card')).toBeTruthy();
    expect(queryByText('1624 kcal')).toBeNull();
    expect(queryByText('65 kg')).toBeNull();
  });

  it('opens settings instead of rendering preferences on the dashboard', () => {
    const { store } = buildStore();
    store.auth.setUser(sampleUser);
    const onPressSettings = jest.fn();
    const { getByTestId, queryByTestId } = render(
      wrap(store, <HomeScreen onPressSettings={onPressSettings} />),
    );

    expect(queryByTestId('theme-toggle-dark')).toBeNull();
    expect(queryByTestId('home-signout')).toBeNull();
    fireEvent.press(getByTestId('home-settings'));
    expect(onPressSettings).toHaveBeenCalledTimes(1);
  });
});
