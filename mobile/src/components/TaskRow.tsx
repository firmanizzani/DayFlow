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
import Svg, { Path } from 'react-native-svg';

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
      style={{
        backgroundColor: theme.surface,
        padding: 16,
        borderRadius: 18,
        gap: 8,
        overflow: 'hidden',
      }}
    >
      <Svg
        width={76}
        height={62}
        viewBox="0 0 76 62"
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, right: 0 }}
      >
        <Path
          d="M31 0H76V56C58 43 32 65 12 56C5 37 10 12 31 0Z"
          fill={category?.color ?? (done ? '#35B895' : '#A99BFF')}
          opacity={theme.isDark ? 0.18 : 0.12}
        />
      </Svg>
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
              <View
                style={{
                  backgroundColor: theme.soft,
                  borderRadius: 7,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Label size={12} color={theme.primary}>
                  {category.name}
                </Label>
              </View>
            )}
            {task.dueAt && (
              <Label size={12} muted>
                Due {shortDate(task.dueAt)}
              </Label>
            )}
            <Label size={12} muted>
              {task.priority.toLowerCase()} priority
            </Label>
            {task.priority === 'HIGH' && <Flag size={13} color={theme.danger} />}
            {task.status === 'IN_PROGRESS' && (
              <Label size={12} color={theme.primary}>
                In progress
              </Label>
            )}
          </View>
        </Pressable>
      </View>
      {task.totalSubtasks > 0 && (
        <View
          style={{
            marginLeft: 54,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: theme.soft }}
          >
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.primary,
                width: `${(task.completedSubtasks / task.totalSubtasks) * 100}%`,
              }}
            />
          </View>
          <Label size={12} muted>
            {task.completedSubtasks}/{task.totalSubtasks}
          </Label>
        </View>
      )}
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
