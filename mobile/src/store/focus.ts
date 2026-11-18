import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { secureStorage } from '@/services/storage';

export type FocusMode = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
export interface TimerState {
  clientId: string;
  userId: string;
  taskId: string | null;
  mode: FocusMode;
  totalSeconds: number;
  remaining: number;
  deadline: number | null;
  startedAt: string;
  endedAt: string | null;
  saved: boolean;
  completed: boolean;
}

interface FocusStore {
  timer: TimerState | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  start: (
    userId: string,
    taskId: string | null,
    mode: FocusMode,
    minutes: number,
  ) => void;
  pause: () => void;
  resume: () => void;
  finish: (completed: boolean) => void;
  markSaved: () => void;
  clear: () => void;
}

function persist(timer: TimerState | null) {
  if (timer) void secureStorage.set('dayflow.focus', JSON.stringify(timer));
  else void secureStorage.remove('dayflow.focus');
}

export const useFocus = create<FocusStore>((set, get) => ({
  timer: null,
  hydrated: false,
  async hydrate() {
    const saved = await secureStorage.get('dayflow.focus');
    set({ timer: saved ? JSON.parse(saved) : null, hydrated: true });
  },
  start(userId, taskId, mode, minutes) {
    const timer: TimerState = {
      clientId: Crypto.randomUUID(),
      userId,
      taskId,
      mode,
      totalSeconds: minutes * 60,
      remaining: minutes * 60,
      deadline: Date.now() + minutes * 60000,
      startedAt: new Date().toISOString(),
      endedAt: null,
      saved: false,
      completed: false,
    };
    persist(timer);
    set({ timer });
  },
  pause() {
    const current = get().timer;
    if (!current?.deadline || current.endedAt) return;
    const timer = {
      ...current,
      remaining: Math.max(0, (current.deadline - Date.now()) / 1000),
      deadline: null,
    };
    persist(timer);
    set({ timer });
  },
  resume() {
    const current = get().timer;
    if (!current || current.deadline || current.endedAt) return;
    const timer = { ...current, deadline: Date.now() + current.remaining * 1000 };
    persist(timer);
    set({ timer });
  },
  finish(completed) {
    const current = get().timer;
    if (!current || current.endedAt) return;
    const remaining = completed
      ? 0
      : current.deadline
        ? Math.max(0, (current.deadline - Date.now()) / 1000)
        : current.remaining;
    const endTime =
      completed && current.deadline
        ? Math.min(Date.now(), current.deadline)
        : Date.now();
    const timer = {
      ...current,
      remaining,
      deadline: null,
      endedAt: new Date(endTime).toISOString(),
      completed,
    };
    persist(timer);
    set({ timer });
  },
  markSaved() {
    const current = get().timer;
    if (!current) return;
    const timer = { ...current, saved: true };
    persist(timer);
    set({ timer });
  },
  clear() {
    persist(null);
    set({ timer: null });
  },
}));
