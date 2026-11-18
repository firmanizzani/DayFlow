import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Native credentials live in Keychain/Keystore. Web preview keeps them in memory.
const previewStorage = new Map<string, string>();

export const secureStorage = {
  async get(key: string) {
    return Platform.OS === 'web'
      ? (previewStorage.get(key) ?? null)
      : SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') previewStorage.set(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (Platform.OS === 'web') previewStorage.delete(key);
    else await SecureStore.deleteItemAsync(key);
  },
};
