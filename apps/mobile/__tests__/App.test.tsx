import React from 'react';
import { Platform } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { App } from '../src/app/App';
import { createInMemoryStorage, STORAGE_KEYS } from '../src/services/secureStorage';
import * as nativeStorage from '../src/services/nativeSecureStorage';

describe('App', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mounts the SignIn screen after app-state hydration', async () => {
    const { findByTestId, getByTestId } = render(<App storage={createInMemoryStorage()} />);
    expect(getByTestId('app-bootstrap-loading')).toBeTruthy();
    expect(await findByTestId('signin-screen')).toBeTruthy();
  });

  it('renders with the persisted locale through the shared i18n instance', async () => {
    const storage = createInMemoryStorage({ [STORAGE_KEYS.locale]: 'en' });
    const { findByTestId, getAllByText } = render(<App locale="he" storage={storage} />);

    expect(await findByTestId('signin-screen')).toBeTruthy();
    expect(getAllByText('Sign in').length).toBeGreaterThan(0);
  });

  it('uses native secure storage when no storage is injected', async () => {
    const createNative = jest
      .spyOn(nativeStorage, 'createNativeSecureStorage')
      .mockReturnValue(createInMemoryStorage());

    const { findByTestId } = render(<App locale="en" />);
    await findByTestId('signin-screen');

    await waitFor(() => expect(createNative).toHaveBeenCalledTimes(1));
  });

  it('does not call native SecureStore in the web preview', async () => {
    const platform = jest.replaceProperty(Platform, 'OS', 'web');
    const createNative = jest.spyOn(nativeStorage, 'createNativeSecureStorage');

    try {
      const { findByTestId } = render(<App locale="en" />);
      await findByTestId('signin-screen');
      expect(createNative).not.toHaveBeenCalled();
    } finally {
      platform.restore();
    }
  });
});
