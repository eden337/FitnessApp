import type { AxiosInstance } from 'axios';
import { AuthStore } from '../src/stores/AuthStore';
import { createInMemoryStorage, STORAGE_KEYS } from '../src/services/secureStorage';

const buildAxiosMock = () => {
  const calls: { url: string; data: unknown }[] = [];
  const queue: Array<
    | { ok: true; data: unknown }
    | { ok: false; error: { response?: { data?: { error?: { code?: string } } } } }
  > = [];
  const post = jest.fn(async (url: string, data: unknown) => {
    calls.push({ url, data });
    const next = queue.shift();
    if (!next) throw new Error(`unexpected api call: ${url}`);
    if (!next.ok) throw next.error;
    return { data: next.data };
  });
  const api = { post } as unknown as AxiosInstance;
  return {
    api,
    calls,
    enqueueSuccess(data: unknown) {
      queue.push({ ok: true, data });
    },
    enqueueFailure(code: string) {
      queue.push({ ok: false, error: { response: { data: { error: { code } } } } });
    },
  };
};

const sampleUser = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'a@b.io',
  displayName: 'Jane',
  locale: 'he' as const,
  gender: 'female' as const,
  birthDate: '1990-04-15',
  heightCm: 165,
};

describe('AuthStore', () => {
  it('signs up: persists tokens, sets user, transitions to authenticated', async () => {
    const { api, enqueueSuccess } = buildAxiosMock();
    enqueueSuccess({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresInSeconds: 900,
      user: sampleUser,
    });
    const storage = createInMemoryStorage();
    const auth = new AuthStore({ api, storage });

    const ok = await auth.signUp({
      email: 'a@b.io',
      password: 'sup3rS3cret-pw',
      displayName: 'Jane',
      locale: 'he',
      gender: 'female',
      birthDate: '1990-04-15',
      heightCm: 165,
    });
    expect(ok).toBe(true);
    expect(auth.status).toBe('authenticated');
    expect(auth.user).toEqual(sampleUser);
    expect(auth.getTokens().accessToken).toBe('access-1');
    expect(await storage.get(STORAGE_KEYS.refreshToken)).toBe('refresh-1');
  });

  it('signs up: surfaces a server error code as the message', async () => {
    const { api, enqueueFailure } = buildAxiosMock();
    enqueueFailure('email_in_use');
    const auth = new AuthStore({ api, storage: createInMemoryStorage() });

    const ok = await auth.signUp({
      email: 'taken@b.io',
      password: 'sup3rS3cret-pw',
      displayName: 'Jane',
      locale: 'he',
      gender: 'female',
      birthDate: '1990-04-15',
      heightCm: 165,
    });
    expect(ok).toBe(false);
    expect(auth.status).toBe('error');
    expect(auth.errorMessage).toBe('email_in_use');
  });

  it('signs in: tokens stored, user attached', async () => {
    const { api, enqueueSuccess } = buildAxiosMock();
    enqueueSuccess({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      expiresInSeconds: 900,
      user: sampleUser,
    });
    const auth = new AuthStore({ api, storage: createInMemoryStorage() });

    const ok = await auth.signIn('a@b.io', 'sup3rS3cret-pw');
    expect(ok).toBe(true);
    expect(auth.status).toBe('authenticated');
    expect(auth.getTokens().refreshToken).toBe('refresh-2');
  });

  it('signs in: 401 transitions to error and keeps tokens null', async () => {
    const { api, enqueueFailure } = buildAxiosMock();
    enqueueFailure('invalid_credentials');
    const auth = new AuthStore({ api, storage: createInMemoryStorage() });

    const ok = await auth.signIn('a@b.io', 'wrong');
    expect(ok).toBe(false);
    expect(auth.status).toBe('error');
    expect(auth.errorMessage).toBe('invalid_credentials');
    expect(auth.getTokens().accessToken).toBeNull();
  });

  it('signs out: revokes refresh + clears state', async () => {
    const { api, enqueueSuccess } = buildAxiosMock();
    enqueueSuccess({
      accessToken: 'a',
      refreshToken: 'r',
      expiresInSeconds: 900,
      user: sampleUser,
    });
    enqueueSuccess({}); // logout response
    const storage = createInMemoryStorage();
    const auth = new AuthStore({ api, storage });

    await auth.signIn('a@b.io', 'sup3rS3cret-pw');
    expect(await storage.get(STORAGE_KEYS.refreshToken)).toBe('r');

    await auth.signOut();
    expect(auth.status).toBe('unauthenticated');
    expect(auth.user).toBeNull();
    expect(auth.getTokens().refreshToken).toBeNull();
    expect(await storage.get(STORAGE_KEYS.refreshToken)).toBeNull();
  });

  it('signs out: clears state even when the network logout call fails', async () => {
    const { api, enqueueSuccess, enqueueFailure } = buildAxiosMock();
    enqueueSuccess({
      accessToken: 'a',
      refreshToken: 'r',
      expiresInSeconds: 900,
      user: sampleUser,
    });
    enqueueFailure('network_down');
    const auth = new AuthStore({ api, storage: createInMemoryStorage() });

    await auth.signIn('a@b.io', 'sup3rS3cret-pw');
    await auth.signOut();
    expect(auth.status).toBe('unauthenticated');
    expect(auth.getTokens().refreshToken).toBeNull();
  });

  it('hydrate: returns unauthenticated when no refresh token is stored', async () => {
    const { api } = buildAxiosMock();
    const auth = new AuthStore({ api, storage: createInMemoryStorage() });
    await auth.hydrate();
    expect(auth.status).toBe('unauthenticated');
  });

  it('hydrate: refreshes successfully when a token is in storage', async () => {
    const { api, enqueueSuccess } = buildAxiosMock();
    enqueueSuccess({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      expiresInSeconds: 900,
      user: sampleUser,
    });
    const storage = createInMemoryStorage({ [STORAGE_KEYS.refreshToken]: 'old-refresh' });
    const auth = new AuthStore({ api, storage });

    await auth.hydrate();
    expect(auth.status).toBe('authenticated');
    expect(auth.user).toEqual(sampleUser);
    expect(await storage.get(STORAGE_KEYS.refreshToken)).toBe('new-refresh');
  });

  it('hydrate: clears state if the stored token is no longer valid', async () => {
    const { api, enqueueFailure } = buildAxiosMock();
    enqueueFailure('invalid_refresh');
    const storage = createInMemoryStorage({ [STORAGE_KEYS.refreshToken]: 'rotten' });
    const auth = new AuthStore({ api, storage });

    await auth.hydrate();
    expect(auth.status).toBe('unauthenticated');
    expect(auth.getTokens().refreshToken).toBeNull();
    expect(await storage.get(STORAGE_KEYS.refreshToken)).toBeNull();
  });

  it('handleAuthFailure clears tokens and user', async () => {
    const { api, enqueueSuccess } = buildAxiosMock();
    enqueueSuccess({
      accessToken: 'a',
      refreshToken: 'r',
      expiresInSeconds: 900,
      user: sampleUser,
    });
    const auth = new AuthStore({ api, storage: createInMemoryStorage() });
    await auth.signIn('a@b.io', 'sup3rS3cret-pw');
    auth.handleAuthFailure();
    expect(auth.user).toBeNull();
    expect(auth.status).toBe('unauthenticated');
  });

  it('setUser updates the stored user without going through the network', () => {
    const { api } = buildAxiosMock();
    const auth = new AuthStore({ api, storage: createInMemoryStorage() });
    auth.setUser(sampleUser);
    expect(auth.user).toEqual(sampleUser);
  });

  it('errorMessageOf falls back when the server returns no structured error', async () => {
    const { api } = buildAxiosMock();
    // Inject a malformed failure (no response body)
    (api.post as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const auth = new AuthStore({ api, storage: createInMemoryStorage() });
    await auth.signIn('x@y.io', 'sup3rS3cret-pw');
    expect(auth.errorMessage).toBe('sign-in failed');
  });
});
