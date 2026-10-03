import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Universal cross-platform storage adapter:
 * - Web: uses window.localStorage
 * - Native (iOS / Android): uses expo-secure-store
 */
const CHUNK_SIZE = 1800;
const CHUNK_PREFIX = '__CHUNKED__:';

export const AppStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {
        console.warn('[AppStorage] getItem localStorage error:', e);
      }
      return null;
    }
    try {
      const raw = await SecureStore.getItemAsync(key);
      if (!raw) return null;
      if (raw.startsWith(CHUNK_PREFIX)) {
        const count = parseInt(raw.slice(CHUNK_PREFIX.length), 10);
        if (isNaN(count) || count <= 0) return null;
        const chunks: string[] = [];
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}__c${i}`);
          if (chunk !== null) {
            chunks.push(chunk);
          }
        }
        return chunks.join('');
      }
      return raw;
    } catch (e) {
      console.warn('[AppStorage] getItem SecureStore error:', e);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn('[AppStorage] setItem localStorage error:', e);
      }
      return;
    }
    try {
      if (value.length <= CHUNK_SIZE) {
        // Clear any previous chunks if transitioning from large to small value
        const prev = await SecureStore.getItemAsync(key);
        if (prev && prev.startsWith(CHUNK_PREFIX)) {
          const prevCount = parseInt(prev.slice(CHUNK_PREFIX.length), 10);
          for (let i = 0; i < prevCount; i++) {
            try { await SecureStore.deleteItemAsync(`${key}__c${i}`); } catch {}
          }
        }
        await SecureStore.setItemAsync(key, value);
      } else {
        const numChunks = Math.ceil(value.length / CHUNK_SIZE);
        for (let i = 0; i < numChunks; i++) {
          const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await SecureStore.setItemAsync(`${key}__c${i}`, chunk);
        }
        await SecureStore.setItemAsync(key, `${CHUNK_PREFIX}${numChunks}`);
      }
    } catch (e) {
      console.warn('[AppStorage] setItem SecureStore error:', e);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn('[AppStorage] removeItem localStorage error:', e);
      }
      return;
    }
    try {
      const prev = await SecureStore.getItemAsync(key);
      if (prev && prev.startsWith(CHUNK_PREFIX)) {
        const count = parseInt(prev.slice(CHUNK_PREFIX.length), 10);
        for (let i = 0; i < count; i++) {
          try { await SecureStore.deleteItemAsync(`${key}__c${i}`); } catch {}
        }
      }
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('[AppStorage] removeItem SecureStore error:', e);
    }
  },
};
