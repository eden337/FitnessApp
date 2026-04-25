import axios from 'axios';
import { createApiClient, type Tokens } from '../src/services/apiClient';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const okResponse = (data: unknown) =>
  Promise.resolve({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  } as never);

const buildClient = () => {
  // axios.create returns a fresh client; wire its interceptors on a stub.
  type Handler = {
    onFulfilled?: (v: unknown) => unknown;
    onRejected?: (e: unknown) => unknown;
  };
  const reqHandlers: Handler[] = [];
  const resHandlers: Handler[] = [];
  const request = jest.fn(async (config: unknown) => {
    return okResponse({ retried: true, headers: (config as { headers: { Authorization: string } }).headers.Authorization });
  });
  const inst = {
    interceptors: {
      request: {
        use: (onFulfilled: Handler['onFulfilled'], onRejected?: Handler['onRejected']) => {
          const handler: Handler = { ...(onFulfilled !== undefined && { onFulfilled }), ...(onRejected !== undefined && { onRejected }) };
          reqHandlers.push(handler);
        },
      },
      response: {
        use: (onFulfilled: Handler['onFulfilled'], onRejected?: Handler['onRejected']) => {
          const handler: Handler = { ...(onFulfilled !== undefined && { onFulfilled }), ...(onRejected !== undefined && { onRejected }) };
          resHandlers.push(handler);
        },
      },
    },
    request,
  };
  mockedAxios.create.mockReturnValue(inst as unknown as ReturnType<typeof axios.create>);
  return { inst, reqHandlers, resHandlers, request };
};

const makeHeaders = (initial: Record<string, string> = {}) => {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    set: (k: string, v: string) => map.set(k, v),
    get: (k: string) => map.get(k),
    asObject: () => Object.fromEntries(map),
  };
};

describe('createApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('attaches the access token on every request when present', () => {
    const { reqHandlers } = buildClient();
    let tokens: Tokens = { accessToken: 'a-token', refreshToken: 'r-token' };
    createApiClient({
      baseURL: 'http://x',
      getTokens: () => tokens,
      setTokens: (t) => {
        tokens = t;
      },
      onAuthFailure: jest.fn(),
    });
    const headers = makeHeaders();
    const config = { headers } as unknown as { headers: ReturnType<typeof makeHeaders> };
    const handler = reqHandlers[0];
    expect(handler).toBeDefined();
    expect(handler!.onFulfilled).toBeDefined();
    handler!.onFulfilled!(config);
    expect(headers.get('Authorization')).toBe('Bearer a-token');
  });

  it('does not attach an Authorization header when no token is present', () => {
    const { reqHandlers } = buildClient();
    createApiClient({
      baseURL: 'http://x',
      getTokens: () => ({ accessToken: null, refreshToken: null }),
      setTokens: jest.fn(),
      onAuthFailure: jest.fn(),
    });
    const headers = makeHeaders();
    const config = { headers } as unknown as { headers: ReturnType<typeof makeHeaders> };
    reqHandlers[0]!.onFulfilled!(config);
    expect(headers.get('Authorization')).toBeUndefined();
  });

  it('refreshes once and retries the original request on 401', async () => {
    const { resHandlers, request } = buildClient();
    let tokens: Tokens = { accessToken: 'old', refreshToken: 'r' };
    const setTokens = jest.fn((t: Tokens) => {
      tokens = t;
    });
    const onAuthFailure = jest.fn();

    // /auth/refresh succeeds with new tokens
    (mockedAxios.post as unknown as jest.Mock) = jest.fn().mockResolvedValueOnce({
      data: { accessToken: 'new', refreshToken: 'r2', expiresInSeconds: 900 },
    });

    createApiClient({
      baseURL: 'http://x',
      getTokens: () => tokens,
      setTokens,
      onAuthFailure,
    });

    const original = {
      headers: makeHeaders({ Authorization: 'Bearer old' }),
      _retried: false,
    } as unknown as { headers: ReturnType<typeof makeHeaders>; _retried: boolean };
    const error = { config: original, response: { status: 401 } };
    const result = await resHandlers[0]!.onRejected!(error);

    expect(setTokens).toHaveBeenCalledWith({ accessToken: 'new', refreshToken: 'r2' });
    expect(request).toHaveBeenCalled();
    expect(original.headers.get('Authorization')).toBe('Bearer new');
    expect(onAuthFailure).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('triggers onAuthFailure when refresh itself fails', async () => {
    const { resHandlers } = buildClient();
    let tokens: Tokens = { accessToken: 'old', refreshToken: 'r' };
    const setTokens = jest.fn((t: Tokens) => {
      tokens = t;
    });
    const onAuthFailure = jest.fn();

    (mockedAxios.post as unknown as jest.Mock) = jest.fn().mockRejectedValueOnce(new Error('refresh-failed'));

    createApiClient({ baseURL: 'http://x', getTokens: () => tokens, setTokens, onAuthFailure });

    const error = {
      config: { headers: makeHeaders(), _retried: false },
      response: { status: 401 },
    };
    await expect(resHandlers[0]!.onRejected!(error)).rejects.toBeDefined();
    expect(onAuthFailure).toHaveBeenCalled();
    expect(setTokens).toHaveBeenLastCalledWith({ accessToken: null, refreshToken: null });
  });

  it('passes through non-401 errors unchanged', async () => {
    const { resHandlers } = buildClient();
    createApiClient({
      baseURL: 'http://x',
      getTokens: () => ({ accessToken: null, refreshToken: null }),
      setTokens: jest.fn(),
      onAuthFailure: jest.fn(),
    });
    const error = { config: { headers: makeHeaders() }, response: { status: 500 } };
    await expect(resHandlers[0]!.onRejected!(error)).rejects.toBe(error);
  });

  it('skips refresh when no refresh token is stored (forces auth failure)', async () => {
    const { resHandlers } = buildClient();
    const onAuthFailure = jest.fn();
    createApiClient({
      baseURL: 'http://x',
      getTokens: () => ({ accessToken: 'old', refreshToken: null }),
      setTokens: jest.fn(),
      onAuthFailure,
    });
    const error = {
      config: { headers: makeHeaders(), _retried: false },
      response: { status: 401 },
    };
    await expect(resHandlers[0]!.onRejected!(error)).rejects.toBe(error);
    expect(onAuthFailure).toHaveBeenCalled();
  });

  it('does not retry an already-retried request', async () => {
    const { resHandlers } = buildClient();
    createApiClient({
      baseURL: 'http://x',
      getTokens: () => ({ accessToken: 'a', refreshToken: 'r' }),
      setTokens: jest.fn(),
      onAuthFailure: jest.fn(),
    });
    const error = {
      config: { headers: makeHeaders(), _retried: true },
      response: { status: 401 },
    };
    await expect(resHandlers[0]!.onRejected!(error)).rejects.toBe(error);
  });

  it('rejects when the error has no config', async () => {
    const { resHandlers } = buildClient();
    createApiClient({
      baseURL: 'http://x',
      getTokens: () => ({ accessToken: 'a', refreshToken: 'r' }),
      setTokens: jest.fn(),
      onAuthFailure: jest.fn(),
    });
    const error = { response: { status: 401 } } as { response: { status: number } };
    await expect(resHandlers[0]!.onRejected!(error)).rejects.toBe(error);
  });
});
