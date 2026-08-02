import Constants from 'expo-constants';

const LOCAL_API_URL = 'http://localhost:4000';

export const resolvePublicUrl = (configured: unknown, fallback: string): string =>
  typeof configured === 'string' && configured.trim().length > 0
    ? configured.trim()
    : fallback;

export const getApiBaseUrl = (): string =>
  resolvePublicUrl(Constants.expoConfig?.extra?.apiUrl, LOCAL_API_URL);

export const getSocketBaseUrl = (): string =>
  resolvePublicUrl(Constants.expoConfig?.extra?.socketUrl, LOCAL_API_URL);
