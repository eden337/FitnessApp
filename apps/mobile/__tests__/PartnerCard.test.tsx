import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { PartnerCard } from '../src/components/PartnerCard';
import { RootStore } from '../src/stores/RootStore';
import { StoresProvider } from '../src/stores/StoresContext';
import { createInMemoryStorage } from '../src/services/secureStorage';

const buildStore = () => {
  const api = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  } as unknown as import('axios').AxiosInstance;
  return new RootStore({
    baseURL: 'http://x',
    storage: createInMemoryStorage(),
    setI18nLanguage: jest.fn(),
    setRtl: jest.fn(),
    api,
  });
};

const wrap = (store: RootStore, ui: React.ReactNode) => (
  <StoresProvider store={store}>
    <I18nProvider locale="en">{ui}</I18nProvider>
  </StoresProvider>
);

describe('PartnerCard', () => {
  it('shows the empty state when no partner is paired', () => {
    const store = buildStore();
    const { getByTestId } = render(wrap(store, <PartnerCard />));
    expect(getByTestId('partner-card-empty')).toBeTruthy();
  });

  it('shows the partner name once the couple has a partner', () => {
    const store = buildStore();
    store.couple.onReady({
      view: {
        couple: {
          id: 'c',
          inviteCode: 'ABCDEFGH',
          createdAt: '2026-04-25T00:00:00.000Z',
          members: [
            { userId: 'a', role: 'owner', joinedAt: '2026-04-25T00:00:00.000Z' },
            { userId: 'b', role: 'member', joinedAt: '2026-04-25T00:00:00.000Z' },
          ],
        },
        partners: [
          {
            id: 'b',
            email: 'b@b.io',
            displayName: 'Bob',
            locale: 'en',
            gender: 'male',
            birthDate: '1990-01-01',
            heightCm: 180,
          },
        ],
      },
    });
    const { getByTestId } = render(wrap(store, <PartnerCard />));
    expect(getByTestId('partner-card-name').props.children).toBe('Bob');
  });

  it('invokes onPress when tapped', () => {
    const store = buildStore();
    const onPress = jest.fn();
    const { getByTestId } = render(wrap(store, <PartnerCard onPress={onPress} />));
    fireEvent.press(getByTestId('partner-card'));
    expect(onPress).toHaveBeenCalled();
  });
});
