/**
 * Tiny key-value store interface so tests can inject an in-memory backend
 * (`createInMemoryStorage`) without mocking the entire `expo-secure-store`
 * module. The native implementation lives in `secureStorage.native.ts` and
 * is intentionally excluded from unit-test coverage — it's a thin wrapper
 * over the Expo SDK and is exercised end-to-end on device.
 */
export type SecureStorage = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

export const createInMemoryStorage = (
  initial: Record<string, string> = {},
): SecureStorage => {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    async get(key) {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    async set(key, value) {
      map.set(key, value);
    },
    async remove(key) {
      map.delete(key);
    },
  };
};

export const STORAGE_KEYS = {
  refreshToken: 'fitnessapp.refreshToken',
  locale: 'fitnessapp.locale',
} as const;
