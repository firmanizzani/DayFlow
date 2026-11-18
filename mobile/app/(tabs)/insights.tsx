import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CircleCheck, Clock3, CalendarCheck2 } from 'lucide-react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import {
  Screen,
  Header,
  Label,
  Chips,
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
        api<Overview>('/insights/overview?' + range),
        api<{ date: string; completedTasks: number }[]>(
          '/insights/completion-trend?' + range,
        ),
        api<{ name: string; color: string; completedTasks: number }[]>(
          '/insights/categories?' + range,
        ),
        api<{ totalSeconds: number; completedSessions: number }>(
          '/insights/focus?' + range,
        ),
      ]);
      return { overview, trend, categories, focus };
    },
  });
  const data = query.data;
  const max = Math.max(1, ...(data?.trend.map((day) => day.completedTasks) ?? []));
  const categoryMax = Math.max(
    1,
    ...(data?.categories.map((category) => category.completedTasks) ?? []),
  );
  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <Header title="Your progress" subtitle="Small steps. A bigger picture." />
      <Chips
        values={['Day', 'Week', 'Month']}
        value={period}
        onChange={(value) => {
          setPeriod(value);
        }}
      />
      <Label muted size={13}>
        {from.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
          ' – ' +
          addDays(to, -1).toLocaleDateString([], { month: 'short', day: 'numeric' })}
      </Label>
      <ErrorNotice error={query.error} retry={() => query.refetch()} />
      {query.isLoading && <Loading />}
      {data && (
        <>
          <View className="flex-row gap-3">
            <View
              style={{
                flex: 1,
                padding: 20,
                borderRadius: 20,
                gap: 12,
                backgroundColor: theme.isDark ? '#1E3938' : '#E1F5EE',
              }}
            >
              <CircleCheck size={24} color={theme.success} />
              <View>
                <Label size={32} bold>
                  {data.overview.completedTasks}
                </Label>
                <Label size={14}>Completed tasks</Label>
              </View>
            </View>
            <View
              style={{
                flex: 1,
                padding: 20,
                borderRadius: 20,
                gap: 12,
                backgroundColor: theme.soft,
              }}
            >
              <Clock3 size={24} color={theme.primary} />
              <View>
                <Label size={32} bold>
                  {Math.floor(data.overview.totalFocusSeconds / 60)}
                </Label>
                <Label size={14}>Focus minutes</Label>
              </View>
            </View>
          </View>
          <Section title="Completed tasks by day">
            <View
              accessibilityLabel={data.trend
                .map((day) => day.date + ': ' + day.completedTasks + ' completed tasks')
                .join(', ')}
            >
              <Svg viewBox="0 0 340 216" width="100%" height={216}>
                {[0, 0.5, 1].map((ratio) => (
                  <Line
                    key={ratio}
                    x1={12}
                    y1={178 - ratio * 136}
                    x2={332}
                    y2={178 - ratio * 136}
                    stroke={theme.border}
                    strokeWidth={1}
                  />
                ))}
                {data.trend.map((day, index) => {
                  const width = 316 / data.trend.length;
                  const height = (day.completedTasks / max) * 128;
                  return (
                    <Rect
                      key={day.date}
                      x={12 + index * width + width * 0.13}
                      y={178 - height}
                      width={width * 0.74}
                      height={day.completedTasks ? height : 0}
                      rx={Math.min(5, width * 0.15)}
                      fill={theme.primary}
                    />
                  );
                })}
                {data.trend
                  .filter((_, index) => data.trend.length <= 7 || index % 5 === 0)
                  .map((day) => {
                    const index = data.trend.indexOf(day);
                    const x = 12 + ((index + 0.5) * 316) / data.trend.length;
                    const label = new Date(day.date + 'T12:00:00');
                    return (
                      <SvgText
                        key={day.date}
                        x={x}
                        y={204}
                        textAnchor="middle"
                        fontSize={12}
                        fill={theme.muted}
                      >
                        {data.trend.length === 7
                          ? label.toLocaleDateString('en', { weekday: 'short' })
                          : label.getDate()}
                      </SvgText>
                    );
                  })}
                {data.trend.length <= 7 &&
                  data.trend.map((day, index) => (
                    <SvgText
                      key={day.date}
                      x={12 + ((index + 0.5) * 316) / data.trend.length}
                      y={166 - (day.completedTasks / max) * 128}
                      textAnchor="middle"
                      fontSize={13}
                      fontWeight="600"
                      fill={theme.ink}
                    >
                      {day.completedTasks}
                    </SvgText>
                  ))}
              </Svg>
            </View>
          </Section>
          <View
            style={{
              padding: 20,
              borderRadius: 20,
              gap: 12,
              backgroundColor: theme.isDark ? '#1E3938' : '#E1F5EE',
            }}
          >
            <View className="flex-row items-center gap-3">
              <CalendarCheck2 size={24} color={theme.success} />
              <View style={{ flex: 1 }}>
                <Label bold>Planned vs. completed</Label>
                <Label size={13} muted>
                  {data.overview.completedPlannedTasks +
                    ' of ' +
                    data.overview.plannedTasks +
                    ' planned tasks'}
                </Label>
              </View>
              <Label size={19} bold>
                {data.overview.completionRate}%
              </Label>
            </View>
            <View
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.isDark ? '#39524D' : '#CBE6DD',
                marginLeft: 36,
              }}
            >
              <View
                style={{
                  height: 8,
                  borderRadius: 4,
                  width: data.overview.completionRate + '%',
                  backgroundColor: theme.primary,
                }}
              />
            </View>
          </View>
          <Section title="By category">
            {data.categories
              .filter((category) => category.completedTasks > 0)
              .map((category) => (
                <View
                  key={category.name}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: theme.surface,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Label bold size={14}>
                      {category.name}
                    </Label>
                    <Label muted size={12}>
                      {category.completedTasks +
                        (category.completedTasks === 1 ? ' task' : ' tasks')}
                    </Label>
                  </View>
                  <View
                    style={{
                      width: '40%',
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.soft,
                    }}
                  >
                    <View
                      style={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.primary,
                        width: (category.completedTasks / categoryMax) * 100 + '%',
                      }}
                    />
                  </View>
                </View>
              ))}
            {!data.categories.some((category) => category.completedTasks) && (
              <Label muted>Your categories will appear as you complete tasks.</Label>
            )}
          </Section>
          <Label muted size={13}>
            {data.focus.completedSessions + ' completed focus sessions in this period.'}
          </Label>
          {!data.overview.completedTasks && !data.overview.totalFocusSeconds && (
            <Empty
              title="Your progress story starts here."
              action="Create a task"
              onAction={() => router.push('/tasks/edit')}
            />
          )}
        </>
      )}
    </Screen>
  );
}
