import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { SignUpScreen } from '../src/screens/auth/SignUpScreen';
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

const fillValid = (getByTestId: (id: string) => unknown) => {
  const t = getByTestId as (id: string) => { props: unknown };
  fireEvent.changeText(t('signup-email') as never, 'a@b.io');
  fireEvent.changeText(t('signup-password') as never, 'sup3rS3cret-pw');
  fireEvent.changeText(t('signup-displayName') as never, 'Jane');
  fireEvent.changeText(t('signup-birthDate') as never, '1990-04-15');
  fireEvent.changeText(t('signup-heightCm') as never, '165');
};

describe('SignUpScreen', () => {
  it('blocks submit when required fields are blank and shows errors', () => {
    const post = jest.fn();
    const store = buildStore(post);
    const { getByTestId } = render(wrap(store, <SignUpScreen onSwitchToSignIn={() => {}} />));
    fireEvent.press(getByTestId('signup-submit'));
    expect(post).not.toHaveBeenCalled();
    expect(getByTestId('signup-email-error')).toBeTruthy();
    expect(getByTestId('signup-password-error')).toBeTruthy();
    expect(getByTestId('signup-displayName-error')).toBeTruthy();
    expect(getByTestId('signup-birthDate-error')).toBeTruthy();
    expect(getByTestId('signup-heightCm-error')).toBeTruthy();
  });

  it('lets the user pick a gender via the segmented picker', () => {
    const store = buildStore();
    const { getByTestId } = render(wrap(store, <SignUpScreen onSwitchToSignIn={() => {}} />));
    fireEvent.press(getByTestId('signup-gender-male'));
    // Re-render reflects the selection without throwing
    expect(getByTestId('signup-gender-male')).toBeTruthy();
  });

  it('sends a register request when the form is valid', async () => {
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
    const { getByTestId } = render(wrap(store, <SignUpScreen onSwitchToSignIn={() => {}} />));
    fillValid(getByTestId);
    fireEvent.press(getByTestId('signup-submit'));
    await Promise.resolve();
    expect(post).toHaveBeenCalledWith(
      '/api/v1/auth/register',
      expect.objectContaining({
        email: 'a@b.io',
        displayName: 'Jane',
        birthDate: '1990-04-15',
        heightCm: 165,
      }),
    );
  });

  it('shows a translated server error on email_in_use', async () => {
    const post = jest.fn().mockRejectedValueOnce({
      response: { data: { error: { code: 'email_in_use' } } },
    });
    const store = buildStore(post);
    const { getByTestId, findByTestId } = render(
      wrap(store, <SignUpScreen onSwitchToSignIn={() => {}} />),
    );
    fillValid(getByTestId);
    fireEvent.press(getByTestId('signup-submit'));
    const err = await findByTestId('signup-server-error');
    expect(err.props.children).toBe('That email is already registered');
  });

  it('uses the fallback message for unknown server error codes', async () => {
    const post = jest.fn().mockRejectedValueOnce({
      response: { data: { error: { code: 'mystery_code' } } },
    });
    const store = buildStore(post);
    const { getByTestId, findByTestId } = render(
      wrap(store, <SignUpScreen onSwitchToSignIn={() => {}} />),
    );
    fillValid(getByTestId);
    fireEvent.press(getByTestId('signup-submit'));
    const err = await findByTestId('signup-server-error');
    expect(err.props.children).toBe('Something went wrong, please try again');
  });

  it('invokes onSwitchToSignIn when the footer button is pressed', () => {
    const store = buildStore();
    const onSwitch = jest.fn();
    const { getByTestId } = render(wrap(store, <SignUpScreen onSwitchToSignIn={onSwitch} />));
    fireEvent.press(getByTestId('signup-switch'));
    expect(onSwitch).toHaveBeenCalled();
  });
});
