import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useFocus } from '@/store/focus';
import { useSession } from '@/store/session';
import { mutate } from './api';

export function FocusRuntime() {
  const timer = useFocus((state) => state.timer);
  const userId = useSession((state) => state.user?.id);
  const save = useMutation({
    mutationFn: async () => {
      if (!timer?.endedAt || timer.userId !== userId) return;
      const duration = Math.floor(timer.totalSeconds - timer.remaining);
      if (duration > 0) {
        await mutate('/focus-sessions', 'POST', {
          clientId: timer.clientId,
          taskId: timer.taskId,
          mode: timer.mode,
          startedAt: timer.startedAt,
          endedAt: timer.endedAt,
          durationSeconds: duration,
          completed: timer.completed,
        });
      }
      useFocus.getState().markSaved();
    },
  });

  useEffect(() => {
    void useFocus.getState().hydrate();
  }, []);

  useEffect(() => {
    const check = () => {
      const current = useFocus.getState().timer;
      if (
        current &&
        current.userId === userId &&
        current.deadline &&
        !current.endedAt &&
        Date.now() >= current.deadline
      ) {
        useFocus.getState().finish(true);
      }
    };
    const interval = setInterval(check, 1000);
    const listener = AppState.addEventListener('change', check);
    check();
    return () => {
      clearInterval(interval);
      listener.remove();
    };
  }, [userId]);

  useEffect(() => {
    if (
      timer &&
      timer.userId === userId &&
      timer.endedAt &&
      !timer.saved &&
      !save.isPending
    ) {
      save.mutate();
    }
  }, [timer?.endedAt, timer?.saved, userId]);

  return null;
}
