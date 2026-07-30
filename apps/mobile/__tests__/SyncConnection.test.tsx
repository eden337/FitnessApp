import React from 'react';
import { render } from '@testing-library/react-native';
import type { AxiosInstance } from 'axios';
import type { Socket } from 'socket.io-client';
import { SyncConnection } from '../src/app/SyncConnection';
import { createSocketClient } from '../src/services/socketClient';
import { createInMemoryStorage } from '../src/services/secureStorage';
import { RootStore } from '../src/stores/RootStore';
import { StoresProvider } from '../src/stores/StoresContext';

jest.mock('../src/services/socketClient', () => ({
  createSocketClient: jest.fn(),
}));
jest.mock('../src/services/runtimeConfig', () => ({
  getSocketBaseUrl: () => 'https://sync.example',
}));

describe('SyncConnection', () => {
  it('binds one authenticated socket and cleans it up on sign-out', () => {
    const socket = {
      connected: false,
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    } as unknown as Socket;
    const close = jest.fn();
    (createSocketClient as jest.Mock).mockReturnValue({
      socket,
      close,
      once: jest.fn(),
    });
    const store = new RootStore({
      baseURL: 'http://x',
      storage: createInMemoryStorage(),
      setI18nLanguage: jest.fn(),
      setRtl: jest.fn(),
      api: {} as AxiosInstance,
    });
    store.auth.setTokens({ accessToken: 'first', refreshToken: 'refresh' });
    store.auth.setUser({
      id: '00000000-0000-4000-8000-000000000001',
      email: 'jane@example.com',
      displayName: 'Jane',
      locale: 'en',
      gender: 'female',
      birthDate: '1990-04-15',
      heightCm: 165,
    });
    (store.auth as unknown as { status: string }).status = 'authenticated';
    const rendered = render(
      <StoresProvider store={store}>
        <SyncConnection />
      </StoresProvider>,
    );

    expect(socket.on).toHaveBeenCalledWith('couple:ready', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('activity:created', expect.any(Function));
    const options = (createSocketClient as jest.Mock).mock.calls[0][0] as {
      getToken: () => string | null;
      url: string;
    };
    expect(options.url).toBe('https://sync.example');
    store.auth.setTokens({ accessToken: 'refreshed', refreshToken: 'refresh-2' });
    expect(options.getToken()).toBe('refreshed');

    rendered.unmount();
    expect(socket.off).toHaveBeenCalledWith('couple:ready');
    expect(socket.off).toHaveBeenCalledWith(
      'activity:created',
      store.activity.onActivityCreated,
    );
    expect(close).toHaveBeenCalled();
  });
});
