import { create } from 'zustand';
import { secureStorage } from '@/services/storage';
import type { Session, User } from '@/types';

interface SessionState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  onboardingSeen: boolean;
  hydrate: () => Promise<void>;
  setSession: (session: Session) => Promise<void>;
  clear: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,
  onboardingSeen: false,
  async hydrate() {
    try {
      const saved = await secureStorage.get('dayflow.session');
      const seen = await secureStorage.get('dayflow.onboarding');
      set({ ...(saved ? JSON.parse(saved) : {}), onboardingSeen: seen === 'yes' });
    } finally {
      set({ hydrated: true });
    }
  },
  async setSession(session) {
    await secureStorage.set('dayflow.session', JSON.stringify(session));
    set(session);
  },
  async clear() {
    await secureStorage.remove('dayflow.session');
    set({ user: null, accessToken: null, refreshToken: null });
  },
  async finishOnboarding() {
    await secureStorage.set('dayflow.onboarding', 'yes');
    set({ onboardingSeen: true });
  },
}));
