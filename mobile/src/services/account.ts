import { router } from 'expo-router';
import { useSession } from '@/store/session';
import { useFocus } from '@/store/focus';
import { queryClient } from './api';
import { clearReminders } from './notifications';

export async function endLocalSession() {
  await clearReminders();
  useFocus.getState().clear();
  await useSession.getState().clear();
  queryClient.clear();
  router.replace('/(auth)/login');
}
