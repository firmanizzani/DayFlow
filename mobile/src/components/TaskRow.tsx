import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Check, Flag } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useMutation } from '@tanstack/react-query';
import { Label, ErrorNotice } from './ui';
import { mutate } from '@/services/api';
import { useTheme } from '@/theme';
import { shortDate } from '@/utils/date';
import type { Task, Category } from '@/types';

export function TaskRow({
  task,
  categories = [],
  planAction = false,
}: {
  task: Task;
  categories?: Category[];
  planAction?: boolean;
}) {
  const theme = useTheme();
  const category = categories.find((item) => item.id === task.categoryId);
  const done = task.status === 'COMPLETED';
  const previous = useRef(done);
  const scale = useSharedValue(1);
  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  useEffect(() => {
    if (previous.current === done) return;
    previous.current = done;
    const options = { duration: 110, reduceMotion: ReduceMotion.System };
    scale.value = withSequence(withTiming(0.82, options), withTiming(1, options));
  }, [done]);
  const mutation = useMutation({
    mutationFn: () =>
      mutate(`/tasks/${task.id}/status`, 'PATCH', {
        status: done ? 'TODO' : 'COMPLETED',
      }),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    },
  });
  return (
    <Animated.View
      layout={LinearTransition.duration(200).reduceMotion(ReduceMotion.System)}
      style={{ backgroundColor: theme.surface, padding: 16, borderRadius: 18, gap: 8 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={`Complete ${task.title}`}
          accessibilityState={{ checked: done, disabled: mutation.isPending }}
          disabled={mutation.isPending}
          onPress={() => mutation.mutate()}
          style={{
            minHeight: 44,
            minWidth: 44,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Animated.View
            style={[
              checkboxStyle,
              {
                height: 24,
                width: 24,
                borderRadius: 8,
                borderWidth: done ? 0 : 1.5,
                borderColor: theme.border,
                backgroundColor: done ? theme.primary : theme.background,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            {done && <Check size={16} color={theme.primaryInk} />}
          </Animated.View>
        </Pressable>
        <Pressable
          onPress={() =>
            router.push({ pathname: '/tasks/[id]', params: { id: task.id } })
          }
          style={{ flex: 1, gap: 6, minHeight: 44 }}
        >
          <Label bold color={done ? theme.muted : theme.ink}>
            {task.title}
          </Label>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {category && (
              <Label size={12} color={theme.primary}>
                {category.name}
              </Label>
            )}
            {task.dueAt && (
              <Label size={12} muted>
                Due {shortDate(task.dueAt)}
              </Label>
            )}
            {task.totalSubtasks > 0 && (
              <Label size={12} muted>
                {task.completedSubtasks}/{task.totalSubtasks} steps
              </Label>
            )}
            {task.priority === 'HIGH' && <Flag size={13} color={theme.danger} />}
            {task.status === 'IN_PROGRESS' && (
              <Label size={12} color={theme.primary}>
                In progress
              </Label>
            )}
          </View>
        </Pressable>
      </View>
      {planAction && (
        <Pressable
          onPress={() =>
            router.push({ pathname: '/planner', params: { taskId: task.id } })
          }
          style={{ alignSelf: 'flex-start', paddingVertical: 10, marginLeft: 54 }}
        >
          <Label size={13} color={theme.primary} bold>
            Plan this task
          </Label>
        </Pressable>
      )}
      <ErrorNotice error={mutation.error} />
    </Animated.View>
  );
}
