import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { RootNavigator } from '../src/app/RootNavigator';
import { RootStore } from '../src/stores/RootStore';
import { StoresProvider } from '../src/stores/StoresContext';
import { createInMemoryStorage } from '../src/services/secureStorage';

const buildStore = (apiOverrides: Partial<Record<'get' | 'post' | 'put' | 'patch', jest.Mock>> = {}) => {
  const get = apiOverrides.get ?? jest.fn();
  const post = apiOverrides.post ?? jest.fn();
  const put = apiOverrides.put ?? jest.fn();
  const patch = apiOverrides.patch ?? jest.fn();
  const api = { get, post, put, patch } as unknown as import('axios').AxiosInstance;

  return new RootStore({
    baseURL: 'http://x',
    storage: createInMemoryStorage(),
    setI18nLanguage: jest.fn(),
    setRtl: jest.fn(),
    api,
  });
};

const wrap = (store: RootStore) => (children: React.ReactNode) =>
  (
    <StoresProvider store={store}>
      <I18nProvider locale="en">{children}</I18nProvider>
    </StoresProvider>
  );

const sampleProfile = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'a@b.io',
  displayName: 'Jane',
  locale: 'en' as const,
  gender: 'female' as const,
  birthDate: '1990-04-15',
  heightCm: 165,
};

describe('RootNavigator', () => {
  it('shows SignIn when status is unauthenticated', () => {
    const store = buildStore();
    store.auth.handleAuthFailure();
    const { getByTestId } = render(wrap(store)(<RootNavigator />));
    expect(getByTestId('signin-screen')).toBeTruthy();
  });

  it('shows ProfileSetup when authed but metrics are not initialized', async () => {
    const get = jest.fn().mockResolvedValueOnce({
      data: { profile: sampleProfile, metrics: null, derived: null },
    });
    const store = buildStore({ get });
    store.auth.setUser(sampleProfile);
    // Manually mark authenticated via internal API used by tests:
    (store.auth as unknown as { status: string }).status = 'authenticated';

    const { findByTestId } = render(wrap(store)(<RootNavigator />));
    expect(await findByTestId('profile-setup-screen')).toBeTruthy();
  });

  it('shows Home when authed and metrics are initialized', async () => {
    const metrics = {
      currentWeightKg: 65,
      activityLevel: 'moderate' as const,
      goalType: 'lose' as const,
      goalWeightKg: 60,
      dietaryRestrictions: {},
    };
    const derived = { ageYears: 35, bmrKcal: 1370.3, tdeeKcal: 2124, targetKcal: 1624 };
    const get = jest.fn().mockResolvedValueOnce({
      data: { profile: sampleProfile, metrics, derived },
    });
    const store = buildStore({ get });
    store.auth.setUser(sampleProfile);
    (store.auth as unknown as { status: string }).status = 'authenticated';

    const { findByTestId } = render(wrap(store)(<RootNavigator />));
    expect(await findByTestId('home-screen')).toBeTruthy();
  });

  it('shows the loading spinner while auth is loading and no user', () => {
    const store = buildStore();
    (store.auth as unknown as { status: string }).status = 'loading';
    const { getByTestId } = render(wrap(store)(<RootNavigator />));
    expect(getByTestId('root-loading')).toBeTruthy();
  });

  it('switches between SignIn and SignUp via the footer button', () => {
    const store = buildStore();
    const { getByTestId } = render(wrap(store)(<RootNavigator />));
    expect(getByTestId('signin-screen')).toBeTruthy();
    fireEvent.press(getByTestId('signin-switch'));
    expect(getByTestId('signup-screen')).toBeTruthy();
  });

  it('switches back from SignUp to SignIn', () => {
    const store = buildStore();
    const { getByTestId } = render(wrap(store)(<RootNavigator />));
    fireEvent.press(getByTestId('signin-switch'));
    expect(getByTestId('signup-screen')).toBeTruthy();
    fireEvent.press(getByTestId('signup-switch'));
    expect(getByTestId('signin-screen')).toBeTruthy();
  });
});
