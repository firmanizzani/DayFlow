import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import {
  Screen,
  Header,
  Label,
  Chips,
  Surface,
  Section,
  Empty,
  ErrorNotice,
  Loading,
} from '@/components/ui';
import { api, params } from '@/services/api';
import { useTheme } from '@/theme';
import { addDays, startOfDay, weekDates } from '@/utils/date';
import type { Overview } from '@/types';

export default function Insights() {
  const theme = useTheme();
  const [period, setPeriod] = useState('Week');
  const today = new Date();
  const from =
    period === 'Day'
      ? startOfDay(today)
      : period === 'Week'
        ? weekDates(today)[0]
        : new Date(today.getFullYear(), today.getMonth(), 1);
  const to =
    period === 'Day'
      ? addDays(from, 1)
      : period === 'Week'
        ? addDays(from, 7)
        : new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const query = useQuery({
    queryKey: ['insights', period, from.toISOString()],
    queryFn: async () => {
      const range = params({ from: from.toISOString(), to: to.toISOString() });
      const [overview, trend, categories, focus] = await Promise.all([
        api<Overview>(`/insights/overview?${range}`),
        api<{ date: string; completedTasks: number }[]>(
          `/insights/completion-trend?${range}`,
        ),
        api<{ name: string; color: string; completedTasks: number }[]>(
          `/insights/categories?${range}`,
        ),
        api<{ totalSeconds: number; completedSessions: number }>(
          `/insights/focus?${range}`,
        ),
      ]);
      return { overview, trend, categories, focus };
    },
  });
  const data = query.data;
  const max = Math.max(1, ...(data?.trend.map((day) => day.completedTasks) ?? []));
  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <Header
        title="Your progress."
        subtitle="The small things you do become the bigger picture."
      />
      <Chips values={['Day', 'Week', 'Month']} value={period} onChange={setPeriod} />
      <Label muted>
        {from.toLocaleDateString([], { month: 'long', day: 'numeric' })} –{' '}
        {addDays(to, -1).toLocaleDateString([], { month: 'long', day: 'numeric' })}
      </Label>
      <ErrorNotice error={query.error} retry={() => query.refetch()} />
      {query.isLoading && <Loading />}
      {data && (
        <>
          <Surface>
            <Label size={18} bold>
              A little further than before.
            </Label>
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Label size={34} bold color={theme.primary}>
                  {data.overview.completedTasks}
                </Label>
                <Label muted size={13}>
                  Tasks completed
                </Label>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Label size={34} bold>
                  {Math.floor(data.overview.totalFocusSeconds / 60)}
                </Label>
                <Label muted size={13}>
                  Minutes of focus
                </Label>
              </View>
            </View>
          </Surface>
          <Section title="Your activity">
            <View
              accessibilityLabel={`Completed tasks per day: ${data.trend.map((day) => `${day.date}: ${day.completedTasks}`).join(', ')}`}
              style={{ backgroundColor: theme.surface, borderRadius: 20, padding: 12 }}
            >
              <Svg viewBox="0 0 320 190" width="100%" height={190}>
                {data.trend.map((day, index) => {
                  const width = 300 / data.trend.length;
                  const height = (day.completedTasks / max) * 125;
                  return (
                    <Rect
                      key={day.date}
                      x={10 + index * width + width * 0.2}
                      y={145 - height}
                      width={width * 0.6}
                      height={Math.max(1, height)}
                      rx={Math.min(5, width * 0.2)}
                      fill={day.completedTasks ? theme.primary : theme.border}
                    />
                  );
                })}
                {data.trend
                  .filter((_, index) => data.trend.length <= 7 || index % 5 === 0)
                  .map((day) => {
                    const index = data.trend.indexOf(day);
                    return (
                      <SvgText
                        key={day.date}
                        x={10 + ((index + 0.5) * 300) / data.trend.length}
                        y={173}
                        textAnchor="middle"
                        fontSize={11}
                        fill={theme.muted}
                      >
                        {new Date(`${day.date}T12:00:00`).getDate()}
                      </SvgText>
                    );
                  })}
                <SvgText x={12} y={16} fontSize={11} fill={theme.muted}>
                  {max} tasks
                </SvgText>
              </Svg>
            </View>
          </Section>
          <Section title="Plans into progress">
            <Surface>
              <Label size={25} bold>
                {data.overview.completionRate}%
              </Label>
              <Label muted>
                {data.overview.completedPlannedTasks} of {data.overview.plannedTasks}{' '}
                unique planned tasks completed.
              </Label>
              <View
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.border,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: 8,
                    width: `${data.overview.completionRate}%`,
                    backgroundColor: theme.primary,
                  }}
                />
              </View>
            </Surface>
          </Section>
          <Section title="Where your energy went">
            {data.categories
              .filter((category) => category.completedTasks > 0)
              .map((category) => (
                <View
                  key={category.name}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                  }}
                >
                  <Label>{category.name}</Label>
                  <Label bold>{category.completedTasks}</Label>
                </View>
              ))}
            {!data.categories.some((category) => category.completedTasks) && (
              <Label muted>Your categories will appear as you complete tasks.</Label>
            )}
          </Section>
          <Section title="Focus, with room to breathe">
            <Label muted>
              {data.focus.completedSessions} completed focus sessions ·{' '}
              {Math.floor(data.focus.totalSeconds / 60)} minutes
            </Label>
          </Section>
          {!data.overview.completedTasks && !data.overview.totalFocusSeconds && (
            <Empty
              title="Your progress story starts here."
              message="Every completed task is a small step forward."
              action="Create a task"
              onAction={() => router.push('/tasks/edit')}
            />
          )}
        </>
      )}
    </Screen>
  );
}
