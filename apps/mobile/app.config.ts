import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'FitnessApp',
  slug: 'fitnessapp',
  scheme: 'fitnessapp',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: { supportsTablet: true, bundleIdentifier: 'com.fitnessapp.app' },
  android: { package: 'com.fitnessapp.app' },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000',
    socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:4000',
    defaultLocale: process.env.EXPO_PUBLIC_DEFAULT_LOCALE ?? 'he',
  },
};

export default config;
