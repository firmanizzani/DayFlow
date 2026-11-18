import { Pressable, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, CalendarPlus, CheckCheck } from 'lucide-react-native';
import { Label } from './ui';
import { ProgressRing } from './ProgressRing';
import { timeLabel } from '@/utils/date';
import type { Overview, Plan, Task } from '@/types';

export function DailyHero({
  overview,
  plans,
  tasks,
}: {
  overview?: Overview;
  plans: Plan[];
  tasks: Task[];
}) {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const next = plans.find(
    (plan) => plan.status === 'PLANNED' && new Date(plan.endAt).getTime() > Date.now(),
  );
  const nextTask = tasks.find((task) => task.id === next?.taskId);
  const complete = !!overview?.plannedTasks && overview.completionRate === 100;
  return (
    <LinearGradient
      colors={['#393276', '#7564DA']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 28, padding: 22, gap: 24, overflow: 'hidden' }}
    >
      <View className="flex-row items-center gap-3">
        <View className="flex-1 gap-3">
          <Label size={compact ? 20 : 24} bold color="#FFFFFF">
            {complete ? 'A day,\nwell spent.' : 'Your day,\nin motion.'}
          </Label>
          <Label size={13} color="#EBE6FF">
            {overview
              ? `${overview.completedPlannedTasks} of ${overview.plannedTasks} planned tasks complete`
              : 'Finding your daily rhythm…'}
          </Label>
        </View>
        <ProgressRing value={overview?.completionRate ?? 0} size={compact ? 88 : 116} />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          next
            ? router.push({ pathname: '/tasks/[id]', params: { id: next.taskId } })
            : router.push('/planner')
        }
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: '#9385CD',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {next ? (
          <CalendarPlus size={20} color="#DAF7E9" />
        ) : (
          <CheckCheck size={20} color="#DAF7E9" />
        )}
        <View className="flex-1 gap-1">
          <Label size={12} color="#E4DEFF">
            {next
              ? `Up next at ${timeLabel(next.startAt)}`
              : 'A little room for what matters'}
          </Label>
          <Label size={14} bold color="#FFFFFF">
            {nextTask?.title ?? 'Plan your next small step'}
          </Label>
        </View>
        <ArrowUpRight size={18} color="#FFFFFF" />
      </Pressable>
    </LinearGradient>
  );
}
