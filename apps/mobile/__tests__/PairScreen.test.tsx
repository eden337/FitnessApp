import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { AxiosInstance } from 'axios';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { PairScreen } from '../src/screens/couple/PairScreen';
import { RootStore } from '../src/stores/RootStore';
import { StoresProvider } from '../src/stores/StoresContext';
import { createInMemoryStorage } from '../src/services/secureStorage';

const sampleCouple = (members: { userId: string; role: 'owner' | 'member' }[]) => ({
  id: 'couple-1',
  inviteCode: 'ABCDEFGH',
  createdAt: '2026-04-25T00:00:00.000Z',
  members: members.map((m) => ({ ...m, joinedAt: '2026-04-25T00:00:00.000Z' })),
});

const buildStore = (overrides?: { post?: jest.Mock; get?: jest.Mock }) => {
  const post = overrides?.post ?? jest.fn();
  const get = overrides?.get ?? jest.fn();
  const api = {
    get,
    post,
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  } as unknown as AxiosInstance;
  const store = new RootStore({
    baseURL: 'http://x',
    storage: createInMemoryStorage(),
    setI18nLanguage: jest.fn(),
    setRtl: jest.fn(),
    api,
  });
  return { store, post, get };
};

const wrap = (store: RootStore, ui: React.ReactNode) => (
  <StoresProvider store={store}>
    <I18nProvider locale="en">{ui}</I18nProvider>
  </StoresProvider>
);

describe('PairScreen', () => {
  it('shows generate + join CTAs when not in a couple', () => {
    const { store } = buildStore();
    const { getByTestId } = render(wrap(store, <PairScreen />));
    expect(getByTestId('pair-screen')).toBeTruthy();
    expect(getByTestId('pair-create')).toBeTruthy();
    expect(getByTestId('pair-join')).toBeTruthy();
    expect(getByTestId('pair-code-input')).toBeTruthy();
  });

  it('Generate-code button posts to /couples and surfaces the code', async () => {
    const post = jest.fn().mockResolvedValueOnce({
      data: { couple: sampleCouple([{ userId: 'a', role: 'owner' }]), partners: [] },
    });
    const { store } = buildStore({ post });
    const { getByTestId, findByTestId } = render(wrap(store, <PairScreen />));
    fireEvent.press(getByTestId('pair-create'));
    const code = await findByTestId('pair-code');
    expect(code.props.children).toBe('ABCDEFGH');
    expect(post).toHaveBeenCalledWith('/api/v1/couples');
  });

  it('blocks Join when code is not exactly 8 characters', () => {
    const post = jest.fn();
    const { store } = buildStore({ post });
    const { getByTestId } = render(wrap(store, <PairScreen />));
    fireEvent.changeText(getByTestId('pair-code-input'), 'short');
    fireEvent.press(getByTestId('pair-join'));
    expect(post).not.toHaveBeenCalled();
    expect(getByTestId('pair-code-input-error')).toBeTruthy();
  });

  it('joins on a valid 8-char code and calls onClose on success', async () => {
    const post = jest.fn().mockResolvedValueOnce({
      data: {
        couple: sampleCouple([
          { userId: 'a', role: 'owner' },
          { userId: 'b', role: 'member' },
        ]),
        partners: [
          {
            id: 'a',
            email: 'a@b.io',
            displayName: 'A',
            locale: 'en',
            gender: 'female',
            birthDate: '1990-01-01',
            heightCm: 165,
          },
        ],
      },
    });
    const onClose = jest.fn();
    const { store } = buildStore({ post });
    const { getByTestId } = render(wrap(store, <PairScreen onClose={onClose} />));
    fireEvent.changeText(getByTestId('pair-code-input'), 'abcdefgh');
    fireEvent.press(getByTestId('pair-join'));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/v1/couples/join', { inviteCode: 'ABCDEFGH' }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows the translated server error when join fails', async () => {
    const post = jest.fn().mockRejectedValueOnce({
      response: { data: { error: { code: 'invite_not_found' } } },
    });
    const { store } = buildStore({ post });
    const { getByTestId, findByTestId } = render(wrap(store, <PairScreen />));
    fireEvent.changeText(getByTestId('pair-code-input'), 'ABCDEFGH');
    fireEvent.press(getByTestId('pair-join'));
    const err = await findByTestId('pair-server-error');
    expect(err.props.children).toBe('That code is wrong or expired');
  });

  it('falls back to a generic message for unknown error codes', async () => {
    const post = jest.fn().mockRejectedValueOnce({
      response: { data: { error: { code: 'mystery_unknown' } } },
    });
    const { store } = buildStore({ post });
    const { getByTestId, findByTestId } = render(wrap(store, <PairScreen />));
    fireEvent.changeText(getByTestId('pair-code-input'), 'ABCDEFGH');
    fireEvent.press(getByTestId('pair-join'));
    const err = await findByTestId('pair-server-error');
    expect(err.props.children).toBe('Something went wrong, please try again');
  });
});
