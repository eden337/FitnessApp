import * as SecureStore from 'expo-secure-store';
import type { SecureStorage } from './secureStorage';

/** Thin wrapper around expo-secure-store. Excluded from unit-test coverage. */
export const createNativeSecureStorage = (): SecureStorage => ({
  async get(key) {
    return SecureStore.getItemAsync(key);
  },
  async set(key, value) {
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key) {
    await SecureStore.deleteItemAsync(key);
  },
});
