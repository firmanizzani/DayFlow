import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useQuery } from '@tanstack/react-query';
import { api, params } from './api';
import { usePreferences } from '@/theme';
import { addDays } from '@/utils/date';
import type { Plan, Task, Page } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestReminderPermission() {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('plans', {
      name: 'Daily plans',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

export async function clearReminders() {
  if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync();
}

export function NotificationReconciler() {
  const { data: preferences } = usePreferences();
  const query = useQuery({
    queryKey: ['notification-plans'],
    queryFn: async () => {
      const from = new Date();
      const to = addDays(from, 28);
      const plans = await api<Plan[]>(
        `/planning-sessions?${params({ from: from.toISOString(), to: to.toISOString() })}`,
      );
      const tasks = await Promise.all(
        [...new Set(plans.map((plan) => plan.taskId))].map((id) =>
          api<Task>(`/tasks/${id}`),
        ),
      );
      return { plans, tasks };
    },
    enabled: Platform.OS !== 'web',
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void query.refetch();
    });
    if (Platform.OS === 'web') return () => subscription.remove();
    const tap = Notifications.addNotificationResponseReceivedListener((event) => {
      const taskId = event.notification.request.content.data?.taskId;
      if (typeof taskId === 'string')
        router.push({ pathname: '/tasks/[id]', params: { id: taskId } });
    });
    return () => {
      subscription.remove();
      tap.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !preferences || !query.data) return;
    let cancelled = false;
    async function reconcile() {
      const permission = await Notifications.getPermissionsAsync();
      if (!preferences!.notificationsEnabled || !permission.granted) {
        await clearReminders();
        return;
      }
      const data = query.data!;
      const desired = data.plans
        .filter(
          (plan) =>
            plan.status === 'PLANNED' &&
            plan.reminderMinutesBefore !== null &&
            data.tasks.find((task) => task.id === plan.taskId)?.status !== 'COMPLETED',
        )
        .map((plan) => ({
          plan,
          at: new Date(plan.startAt).getTime() - plan.reminderMinutesBefore! * 60000,
        }))
        .filter((item) => item.at > Date.now())
        .sort((a, b) => a.at - b.at)
        .slice(0, 60);
      const existing = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of existing) {
        if (!notification.identifier.startsWith('plan-')) continue;
        const target = desired.find(
          (item) => `plan-${item.plan.id}` === notification.identifier,
        );
        if (!target || notification.content.data?.at !== target.at) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      for (const { plan, at } of desired) {
        if (cancelled) return;
        if (
          existing.some(
            (item) =>
              item.identifier === `plan-${plan.id}` && item.content.data?.at === at,
          )
        )
          continue;
        await Notifications.scheduleNotificationAsync({
          identifier: `plan-${plan.id}`,
          content: {
            title: 'A little time for your plan',
            body:
              data.tasks.find((task) => task.id === plan.taskId)?.title ??
              'Your planned task',
            data: { taskId: plan.taskId, at },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(at),
            channelId: 'plans',
          },
        });
      }
    }
    void reconcile().catch(() => {
      // Keep the saved server preference; Settings exposes permission recovery.
    });
    return () => {
      cancelled = true;
    };
  }, [preferences, query.data]);
  return null;
}
