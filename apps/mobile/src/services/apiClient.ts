import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

export type Tokens = { accessToken: string | null; refreshToken: string | null };

export type ApiClientOptions = {
  baseURL: string;
  /** Returns the *current* tokens. Read on every request. */
  getTokens: () => Tokens;
  /** Persists a new token pair after a refresh. */
  setTokens: (tokens: Tokens) => void;
  /** Called when refresh fails (token expired / revoked) — UI should sign out. */
  onAuthFailure: () => void;
};

type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * Creates an axios instance that:
 * 1. Injects the current access token on every request (when present).
 * 2. On a 401 response, calls `/auth/refresh` once with the stored refresh
 *    token; on success it persists the new pair and retries the original
 *    request, on failure it calls `onAuthFailure`.
 *
 * The refresh is deduplicated — if multiple requests get a 401 simultaneously
 * they all wait on the same in-flight refresh promise, then retry.
 */
export const createApiClient = (opts: ApiClientOptions): AxiosInstance => {
  const client = axios.create({ baseURL: opts.baseURL, timeout: 15000 });

  client.interceptors.request.use((config) => {
    const { accessToken } = opts.getTokens();
    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return config;
  });

  let refreshing: Promise<string | null> | null = null;

  const performRefresh = async (refreshToken: string): Promise<string | null> => {
    try {
      const res = await axios.post<{
        accessToken: string;
        refreshToken: string;
        expiresInSeconds: number;
      }>(`${opts.baseURL}/api/v1/auth/refresh`, { refreshToken });
      opts.setTokens({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
      return res.data.accessToken;
    } catch {
      opts.setTokens({ accessToken: null, refreshToken: null });
      opts.onAuthFailure();
      return null;
    }
  };

  client.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const original = error.config as RetryConfig | undefined;
      if (!original || original._retried) return Promise.reject(error);
      if (error.response?.status !== 401) return Promise.reject(error);

      const { refreshToken } = opts.getTokens();
      if (!refreshToken) {
        opts.onAuthFailure();
        return Promise.reject(error);
      }

      refreshing ??= performRefresh(refreshToken).finally(() => {
        refreshing = null;
      });
      const newAccess = await refreshing;
      if (!newAccess) return Promise.reject(error);

      original._retried = true;
      original.headers?.set?.('Authorization', `Bearer ${newAccess}`);
      return client.request(original as AxiosRequestConfig);
    },
  );

  return client;
};
