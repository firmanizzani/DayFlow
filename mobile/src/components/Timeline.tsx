import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Check, ArrowUpRight } from 'lucide-react-native';
import { Label, Empty } from './ui';
import { useTheme } from '@/theme';
import { timeLabel } from '@/utils/date';
import type { Plan, Task, Category } from '@/types';

export function Timeline({
  plans,
  tasks,
  categories = [],
}: {
  plans: Plan[];
  tasks: Task[];
  categories?: Category[];
}) {
  const theme = useTheme();
  const visible = plans.filter(
    (plan) => plan.status === 'PLANNED' || plan.status === 'COMPLETED',
  );
  if (!visible.length)
    return (
      <Empty
        title="Your day is a blank canvas."
        message="Make a little space for what matters."
        action="Plan your day"
        onAction={() => router.push('/planner')}
      />
    );
  return (
    <View style={{ gap: 16 }}>
      {visible.map((plan) => {
        const task = tasks.find((item) => item.id === plan.taskId);
        const category = categories.find((item) => item.id === task?.categoryId);
        return (
          <View key={plan.id} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 55, paddingTop: 16, gap: 6 }}>
              <Label size={12} bold>
                {timeLabel(plan.startAt)}
              </Label>
              <Label size={11} muted>
                {timeLabel(plan.endAt)}
              </Label>
            </View>
            <View style={{ width: 10, paddingTop: 20, alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  height: 9,
                  width: 9,
                  borderRadius: 5,
                  backgroundColor:
                    plan.status === 'COMPLETED'
                      ? theme.success
                      : (category?.color ?? theme.primary),
                }}
              />
              <View
                style={{
                  width: 1,
                  flex: 1,
                  minHeight: 35,
                  backgroundColor: theme.border,
                }}
              />
            </View>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/tasks/[id]', params: { id: plan.taskId } })
              }
              style={({ pressed }) => ({
                flex: 1,
                minHeight: Math.min(
                  200,
                  Math.max(
                    84,
                    (new Date(plan.endAt).getTime() -
                      new Date(plan.startAt).getTime()) /
                      60000,
                  ),
                ),
                padding: 18,
                borderRadius: 20,
                backgroundColor: category
                  ? `${category.color}${theme.isDark ? '28' : '16'}`
                  : theme.soft,
                opacity: pressed ? 0.75 : 1,
                gap: 8,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <Label bold>{task?.title ?? 'Scheduled task'}</Label>
                {plan.status === 'COMPLETED' ? (
                  <Check size={18} color={theme.success} />
                ) : (
                  <ArrowUpRight size={18} color={theme.primary} />
                )}
              </View>
              <Label size={12} muted>
                {category?.name ?? 'Personal plan'} ·{' '}
                {Math.round(
                  (new Date(plan.endAt).getTime() - new Date(plan.startAt).getTime()) /
                    60000,
                )}{' '}
                min
              </Label>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
