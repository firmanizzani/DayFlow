import { View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Label } from './ui';
import { FlowMotif } from './FlowMotif';
import { ProgressRing } from './ProgressRing';
import { useTheme } from '@/theme';
import type { Overview, Plan, Task } from '@/types';

export function DailyHero({
  overview,
}: {
  overview?: Overview;
  plans: Plan[];
  tasks: Task[];
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const ink = theme.isDark ? '#FFFFFF' : '#29234C';
  return (
    <LinearGradient
      colors={theme.isDark ? ['#393276', '#554397'] : ['#F0EAFF', '#E6DDFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 24, padding: 22, overflow: 'hidden', minHeight: 168 }}
    >
      <FlowMotif color={theme.isDark ? '#9380DB' : '#B8A4F2'} opacity={0.48} />
      <View className="flex-row items-center gap-3">
        <View className="flex-1 gap-2" style={{ paddingBottom: 18 }}>
          <Label size={compact ? 24 : 28} bold color={ink}>
            {overview
              ? overview.completedPlannedTasks + ' of ' + overview.plannedTasks
              : 'Your day'}
          </Label>
          <Label size={15} color={ink}>
            {'planned tasks\ncomplete'}
          </Label>
        </View>
        <ProgressRing
          value={overview?.completionRate ?? 0}
          size={compact ? 106 : 122}
          light={!theme.isDark}
        />
      </View>
    </LinearGradient>
  );
}
