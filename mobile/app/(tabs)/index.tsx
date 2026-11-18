import { useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Timer, ArrowUpRight } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  Screen,
  Header,
  Label,
  Button,
  Section,
  WeekStrip,
  Loading,
  ErrorNotice,
  Surface,
} from '@/components/ui';
import { TaskRow } from '@/components/TaskRow';
import { Timeline } from '@/components/Timeline';
import { DailyHero } from '@/components/DailyHero';
import { api } from '@/services/api';
import { useSession } from '@/store/session';
import { useTheme } from '@/theme';
import { dateKey } from '@/utils/date';
import type { Dashboard, Category, Page, Task, Plan, Occurrence } from '@/types';

export default function Today() {
  const { width } = useWindowDimensions();
  const [date, setDate] = useState(new Date());
  const theme = useTheme();
  const user = useSession((state) => state.user);
  const dashboard = useQuery({
    queryKey: ['dashboard', dateKey(date)],
    queryFn: () => api<Dashboard>(`/dashboard/today?date=${dateKey(date)}`),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
  });
  const plannedTasks = useQuery({
    queryKey: [
      'timeline-tasks',
      dashboard.data?.sessions.map((plan) => plan.taskId).join(','),
    ],
    queryFn: () =>
      Promise.all(
        [...new Set(dashboard.data!.sessions.map((plan) => plan.taskId))].map((id) =>
          api<Task>(`/tasks/${id}`),
        ),
      ),
    enabled: !!dashboard.data,
  });
  const unfinished = useQuery({
    queryKey: ['unfinished'],
    queryFn: () =>
      api<{ overdueTasks: Task[]; missedSessions: Plan[] }>('/dashboard/unfinished'),
  });
  const overview = dashboard.data?.overview;
  const percentage = overview?.completionRate ?? 0;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <Screen
      refreshing={dashboard.isRefetching}
      onRefresh={() => {
        void dashboard.refetch();
        void unfinished.refetch();
      }}
    >
      <Header
        titleSize={width < 360 ? 23 : 30}
        title={`${greeting},\n${user?.name.split(' ')[0] ?? 'there'}.`}
        subtitle={date.toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
        action={
          <Pressable
            accessibilityLabel="Open profile and settings"
            onPress={() => router.push('/settings')}
            style={{
              width: 48,
              height: 48,
              borderRadius: 18,
              backgroundColor: theme.soft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Label bold color={theme.primary}>
              {user?.name.slice(0, 2).toUpperCase()}
            </Label>
          </Pressable>
        }
      />
      <DailyHero
        overview={overview}
        plans={dashboard.data?.sessions ?? []}
        tasks={plannedTasks.data ?? []}
      />
      <WeekStrip date={date} onChange={setDate} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button title="Add task" onPress={() => router.push('/tasks/edit')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button secondary title="Find focus" onPress={() => router.push('/focus')} />
        </View>
      </View>
      <ErrorNotice error={dashboard.error} retry={() => dashboard.refetch()} />
      {dashboard.isLoading ? (
        <Loading />
      ) : (
        dashboard.data && (
          <>
            <Section
              title="Your timeline"
              action="Plan a task"
              onAction={() => router.push('/planner')}
            >
              <Timeline
                plans={dashboard.data.sessions}
                tasks={plannedTasks.data ?? []}
                categories={categories.data}
              />
            </Section>
            <Section
              title="Still on your mind"
              action="View all"
              onAction={() => router.push('/(tabs)/tasks')}
            >
              {dashboard.data.unscheduledTasks.slice(0, 4).map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  categories={categories.data}
                  planAction
                />
              ))}
              {!dashboard.data.unscheduledTasks.length && (
                <Label muted>No unscheduled tasks. A little breathing room.</Label>
              )}
            </Section>
          </>
        )
      )}
      {!!unfinished.data?.overdueTasks.length && (
        <Section title="Past their deadline">
          {unfinished.data.overdueTasks.slice(0, 3).map((task) => (
            <TaskRow key={task.id} task={task} categories={categories.data} />
          ))}
        </Section>
      )}
      {!!unfinished.data?.missedSessions.length && (
        <Section title="Plans to revisit">
          {unfinished.data.missedSessions.slice(0, 3).map((plan) => (
            <Surface key={plan.id}>
              <Label>Missed plan · {new Date(plan.startAt).toLocaleString()}</Label>
              <Button
                secondary
                title="Choose a new time"
                onPress={() =>
                  router.push({
                    pathname: '/planner',
                    params: { sessionId: plan.id, taskId: plan.taskId },
                  })
                }
              />
            </Surface>
          ))}
        </Section>
      )}
    </Screen>
  );
}
