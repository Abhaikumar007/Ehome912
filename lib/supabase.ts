import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { AppStorage } from './storage';

const sanitizeKey = (k: string) => (k || '').replace(/[^a-zA-Z0-9.\-_]/g, '_');

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    return await AppStorage.getItem(sanitizeKey(key));
  },
  setItem: async (key: string, value: string) => {
    await AppStorage.setItem(sanitizeKey(key), value);
  },
  removeItem: async (key: string) => {
    await AppStorage.removeItem(sanitizeKey(key));
  },
};

export const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
