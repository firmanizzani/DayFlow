import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
  Screen,
  Header,
  Label,
  Button,
  Chips,
  WeekStrip,
  Section,
  ErrorNotice,
  Loading,
} from '@/components/ui';
import { Timeline } from '@/components/Timeline';
import { Occurrences } from '@/components/Occurrences';
import { TaskRow } from '@/components/TaskRow';
import { api, params } from '@/services/api';
import { useTheme } from '@/theme';
import { addDays, dateKey, startOfDay, weekDates } from '@/utils/date';
import type { Plan, Task, Page, Category } from '@/types';

export default function Calendar() {
  const theme = useTheme();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('Month');
  function move(direction: number) {
    if (view === 'Month')
      setDate(new Date(date.getFullYear(), date.getMonth() + direction, 1));
    else setDate(addDays(date, direction * (view === 'Week' ? 7 : 1)));
  }
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = addDays(monthStart, -((monthStart.getDay() + 6) % 7));
  const grid = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const from =
    view === 'Month'
      ? gridStart
      : view === 'Week'
        ? weekDates(date)[0]
        : startOfDay(date);
  const to =
    view === 'Month' ? addDays(gridStart, 42) : addDays(from, view === 'Week' ? 7 : 1);
  const plans = useQuery({
    queryKey: ['calendar', view, dateKey(from)],
    queryFn: () =>
      api<Plan[]>(
        `/planning-sessions?${params({ from: from.toISOString(), to: to.toISOString() })}`,
      ),
  });
  const tasks = useQuery({
    queryKey: ['calendar-tasks'],
    queryFn: async () => {
      const result: Task[] = [];
      for (let page = 0; ; page++) {
        const response = await api<Page<Task>>(`/tasks?size=100&page=${page}`);
        result.push(...response.content);
        if (response.last) return result;
      }
    },
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
  });
  const visible =
    plans.data?.filter(
      (plan) => plan.status === 'PLANNED' || plan.status === 'COMPLETED',
    ) ?? [];
  const dayPlans = visible.filter(
    (plan) => dateKey(new Date(plan.startAt)) === dateKey(date),
  );
  const deadlines =
    tasks.data?.filter(
      (task) => task.dueAt && dateKey(new Date(task.dueAt)) === dateKey(date),
    ) ?? [];
  return (
    <Screen
      refreshing={plans.isRefetching}
      onRefresh={() => {
        void plans.refetch();
        void tasks.refetch();
      }}
    >
      <Header
        title={date.toLocaleDateString([], { month: 'long', year: 'numeric' })}
        titleSize={27}
        action={
          <View style={{ flexDirection: 'row' }}>
            <Pressable
              accessibilityLabel="Previous calendar period"
              onPress={() => move(-1)}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={21} color={theme.ink} />
            </Pressable>
            <Pressable
              accessibilityLabel="Next calendar period"
              onPress={() => move(1)}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={21} color={theme.ink} />
            </Pressable>
          </View>
        }
      />
      <Chips values={['Day', 'Week', 'Month']} value={view} onChange={setView} />
      {view === 'Month' ? (
        <View
          style={{
            backgroundColor: 'transparent',
            borderRadius: 24,
            padding: 0,
            gap: 16,
          }}
        >
          <View style={{ flexDirection: 'row' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <View key={index} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
                <Label size={12} muted>
                  {day}
                </Label>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {grid.map((day) => {
              const key = dateKey(day);
              const selected = key === dateKey(date);
              const hasPlan = visible.some(
                (plan) => dateKey(new Date(plan.startAt)) === key,
              );
              const hasDeadline = tasks.data?.some(
                (task) => task.dueAt && dateKey(new Date(task.dueAt)) === key,
              );
              return (
                <Pressable
                  key={key}
                  accessibilityLabel={day.toDateString()}
                  accessibilityState={{ selected }}
                  onPress={() => setDate(day)}
                  style={{
                    width: `${100 / 7}%`,
                    minHeight: 48,
                    paddingVertical: 8,
                    gap: 4,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 14,
                    backgroundColor: selected ? theme.primary : 'transparent',
                  }}
                >
                  <Label
                    size={14}
                    bold={selected}
                    color={
                      selected
                        ? theme.primaryInk
                        : day.getMonth() === date.getMonth()
                          ? theme.ink
                          : theme.muted
                    }
                  >
                    {day.getDate()}
                  </Label>
                  <View style={{ height: 5, flexDirection: 'row', gap: 3 }}>
                    {hasPlan && (
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: selected ? '#FFFFFF' : theme.primary,
                        }}
                      />
                    )}
                    {hasDeadline && (
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 1,
                          backgroundColor: selected ? '#FFD6DC' : theme.danger,
                        }}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Label size={12} muted>
            Round dot: planned activity · Square: deadline
          </Label>
        </View>
      ) : (
        <WeekStrip date={date} onChange={setDate} />
      )}
      <ErrorNotice
        error={plans.error ?? tasks.error}
        retry={() => {
          void plans.refetch();
          void tasks.refetch();
        }}
      />
      {plans.isLoading && <Loading />}
      {view === 'Week' ? (
        weekDates(date).map((day) => (
          <Section
            key={dateKey(day)}
            title={day.toLocaleDateString([], { weekday: 'long', day: 'numeric' })}
            action="Plan"
            onAction={() =>
              router.push({ pathname: '/planner', params: { date: dateKey(day) } })
            }
          >
            <Timeline
              plans={visible.filter(
                (plan) => dateKey(new Date(plan.startAt)) === dateKey(day),
              )}
              tasks={tasks.data ?? []}
              categories={categories.data}
            />
          </Section>
        ))
      ) : (
        <Section
          title={date.toLocaleDateString([], {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
          action="Add to plan"
          onAction={() =>
            router.push({ pathname: '/planner', params: { date: dateKey(date) } })
          }
        >
          <Timeline
            plans={dayPlans}
            tasks={tasks.data ?? []}
            categories={categories.data}
          />
        </Section>
      )}
      {!!deadlines.length && (
        <Section title="Due on this day">
          {deadlines.map((task) => (
            <TaskRow key={task.id} task={task} categories={categories.data} />
          ))}
        </Section>
      )}
      <Section title="Daily rhythms">
        <Occurrences date={dateKey(date)} />
      </Section>
      <Button secondary title="Back to today" onPress={() => setDate(new Date())} />
    </Screen>
  );
}
