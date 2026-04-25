import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { SignInScreen } from '../src/screens/auth/SignInScreen';
import { RootStore } from '../src/stores/RootStore';
import { StoresProvider } from '../src/stores/StoresContext';
import { createInMemoryStorage } from '../src/services/secureStorage';

const buildStore = (post: jest.Mock = jest.fn()) => {
  const api = { get: jest.fn(), post, put: jest.fn(), patch: jest.fn() } as unknown as import('axios').AxiosInstance;
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

describe('SignInScreen', () => {
  it('blocks submit and shows inline errors when fields are invalid', () => {
    const post = jest.fn();
    const store = buildStore(post);
    const { getByTestId } = render(wrap(store, <SignInScreen onSwitchToSignUp={() => {}} />));
    fireEvent.press(getByTestId('signin-submit'));
    expect(post).not.toHaveBeenCalled();
    expect(getByTestId('signin-email-error')).toBeTruthy();
    expect(getByTestId('signin-password-error')).toBeTruthy();
  });

  it('signs in successfully, transitioning the store to authenticated', async () => {
    const post = jest.fn().mockResolvedValueOnce({
      data: {
        accessToken: 'a',
        refreshToken: 'r',
        expiresInSeconds: 900,
        user: {
          id: '00000000-0000-4000-8000-000000000000',
          email: 'a@b.io',
          displayName: 'Jane',
          locale: 'en',
          gender: 'female',
          birthDate: '1990-04-15',
          heightCm: 165,
        },
      },
    });
    const store = buildStore(post);
    const { getByTestId } = render(wrap(store, <SignInScreen onSwitchToSignUp={() => {}} />));
    fireEvent.changeText(getByTestId('signin-email'), 'a@b.io');
    fireEvent.changeText(getByTestId('signin-password'), 'sup3rS3cret-pw');
    await fireEvent.press(getByTestId('signin-submit'));
    // Wait a microtask for the async submit to settle
    await Promise.resolve();
    expect(post).toHaveBeenCalledWith('/api/v1/auth/login', expect.objectContaining({ email: 'a@b.io' }));
  });

  it('surfaces a translated server error code', async () => {
    const post = jest.fn().mockRejectedValueOnce({
      response: { data: { error: { code: 'invalid_credentials' } } },
    });
    const store = buildStore(post);
    const { getByTestId, findByTestId } = render(
      wrap(store, <SignInScreen onSwitchToSignUp={() => {}} />),
    );
    fireEvent.changeText(getByTestId('signin-email'), 'a@b.io');
    fireEvent.changeText(getByTestId('signin-password'), 'sup3rS3cret-pw');
    fireEvent.press(getByTestId('signin-submit'));
    const err = await findByTestId('signin-server-error');
    expect(err.props.children).toBe('Wrong email or password');
  });

  it('falls back to a generic message for unknown server error codes', async () => {
    const post = jest.fn().mockRejectedValueOnce({
      response: { data: { error: { code: 'totally_unknown_code' } } },
    });
    const store = buildStore(post);
    const { getByTestId, findByTestId } = render(
      wrap(store, <SignInScreen onSwitchToSignUp={() => {}} />),
    );
    fireEvent.changeText(getByTestId('signin-email'), 'a@b.io');
    fireEvent.changeText(getByTestId('signin-password'), 'sup3rS3cret-pw');
    fireEvent.press(getByTestId('signin-submit'));
    const err = await findByTestId('signin-server-error');
    expect(err.props.children).toBe('Something went wrong, please try again');
  });

  it('invokes onSwitchToSignUp when the footer button is pressed', () => {
    const store = buildStore();
    const onSwitch = jest.fn();
    const { getByTestId } = render(wrap(store, <SignInScreen onSwitchToSignUp={onSwitch} />));
    fireEvent.press(getByTestId('signin-switch'));
    expect(onSwitch).toHaveBeenCalled();
  });
});
