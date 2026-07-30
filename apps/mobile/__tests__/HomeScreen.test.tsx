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

  it('shows the summary card when derived metrics are present', () => {
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
    store.profile.derived = { ageYears: 35, bmrKcal: 1370.3, tdeeKcal: 2124, targetKcal: 1624 };
    const { getByText, getByTestId } = render(wrap(store, <HomeScreen />));
    expect(getByTestId('home-momentum-card')).toBeTruthy();
    expect(getByText('1624 kcal')).toBeTruthy();
    expect(getByText('65 kg')).toBeTruthy();
  });

  it('signs out when the Sign out button is pressed', async () => {
    const { store, post } = buildStore();
    store.auth.setUser(sampleUser);
    // Pretend the user is authenticated so signOut takes the network path.
    (store.auth as unknown as { status: string }).status = 'authenticated';
    store.auth.setTokens({ accessToken: 'a', refreshToken: 'r' });
    const { getByTestId } = render(wrap(store, <HomeScreen />));
    fireEvent.press(getByTestId('home-signout'));
    await Promise.resolve();
    expect(post).toHaveBeenCalledWith('/api/v1/auth/logout', { refreshToken: 'r' });
  });

  it('lets the user persist a dark appearance override', async () => {
    const { store } = buildStore();
    store.auth.setUser(sampleUser);
    const { getByTestId } = render(wrap(store, <HomeScreen />));

    fireEvent.press(getByTestId('theme-toggle-dark'));
    await Promise.resolve();

    expect(store.theme.preference).toBe('dark');
  });
});
