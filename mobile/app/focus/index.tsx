import { useEffect, useState } from 'react';
import { View, AppState, Pressable, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { TaskPicker } from '@/components/TaskPicker';
import { Screen, Label, Button, Chips, ErrorNotice, Section } from '@/components/ui';
import { useFocus, type FocusMode } from '@/store/focus';
import { useSession } from '@/store/session';
import { usePreferences } from '@/theme';
import { api, mutate } from '@/services/api';
import { remainingSeconds } from '@/utils/date';
import type { Page, Task } from '@/types';

export default function Focus() {
  const { taskId: routeTask } = useLocalSearchParams<{ taskId?: string }>();
  const [taskId, setTaskId] = useState(routeTask ?? '');
  const [mode, setMode] = useState<FocusMode>('FOCUS');
  const [now, setNow] = useState(Date.now());
  const { width } = useWindowDimensions();
  const ringSize = Math.min(240, width - 104);
  const center = ringSize / 2;
  const radius = center - 12;
  const circumference = 2 * Math.PI * radius;
  const user = useSession((state) => state.user);
  const focus = useFocus();
  const { data: preferences } = usePreferences();
  const tasks = useQuery({
    queryKey: ['focus-task-picker'],
    queryFn: () => api<Page<Task>>('/tasks?size=100'),
  });
  const timer = focus.timer?.userId === user?.id ? focus.timer : null;
  const minutes =
    mode === 'FOCUS'
      ? (preferences?.focusMinutes ?? 25)
      : mode === 'SHORT_BREAK'
        ? (preferences?.shortBreakMinutes ?? 5)
        : (preferences?.longBreakMinutes ?? 15);
  const remaining = timer
    ? timer.endedAt
      ? Math.ceil(timer.remaining)
      : timer.deadline
        ? Math.min(timer.totalSeconds, remainingSeconds(timer.deadline, now))
        : Math.ceil(timer.remaining)
    : minutes * 60;
  const total = timer?.totalSeconds ?? minutes * 60;
  const save = useMutation({
    mutationFn: async () => {
      if (!timer?.endedAt) return;
      const duration = Math.floor(timer.totalSeconds - timer.remaining);
      if (duration < 1) return;
      await mutate('/focus-sessions', 'POST', {
        clientId: timer.clientId,
        taskId: timer.taskId,
        mode: timer.mode,
        startedAt: timer.startedAt,
        endedAt: timer.endedAt,
        durationSeconds: duration,
        completed: timer.completed,
      });
    },
    onSuccess: () => focus.markSaved(),
  });
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 500);
    const listener = AppState.addEventListener('change', tick);
    return () => {
      clearInterval(interval);
      listener.remove();
    };
  }, []);
  useEffect(() => {
    if (timer?.deadline && now >= timer.deadline && !timer.endedAt) focus.finish(true);
  }, [now, timer?.deadline, timer?.endedAt]);
  const title = timer?.taskId
    ? tasks.data?.content.find((task) => task.id === timer.taskId)?.title
    : tasks.data?.content.find((task) => task.id === taskId)?.title;
  return (
    <Screen>
      <Pressable
        accessibilityLabel="Leave focus timer"
        onPress={() => router.back()}
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <ArrowLeft color="#7366F0" size={24} />
      </Pressable>
      <LinearGradient
        colors={['#393276', '#24213F']}
        style={{ borderRadius: 28, padding: 28, gap: 28, alignItems: 'center' }}
      >
        <Label size={28} bold color="#FFFFFF">
          A moment for focus.
        </Label>
        <Label color="#DCD5FF">
          {title ?? 'Just you and a little breathing room.'}
        </Label>
        <View
          style={{
            width: ringSize,
            height: ringSize,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg
            width={ringSize}
            height={ringSize}
            style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
          >
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#4F477B"
              strokeWidth={6}
              fill="transparent"
            />
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#BBAEFF"
              strokeWidth={6}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - remaining / total)}
              strokeLinecap="round"
            />
          </Svg>
          <Label size={48} bold color="#FFFFFF">
            {String(Math.floor(remaining / 60)).padStart(2, '0')}:
            {String(remaining % 60).padStart(2, '0')}
          </Label>
          <Label color="#DCD5FF" size={13}>
            {timer?.endedAt
              ? timer.completed
                ? 'A little progress, made.'
                : 'Session ended'
              : timer && !timer.deadline
                ? 'Take your time. You are paused.'
                : 'One thing at a time.'}
          </Label>
        </View>
      </LinearGradient>
      {!timer && (
        <>
          <Chips
            values={['FOCUS', 'SHORT_BREAK', 'LONG_BREAK'] as const}
            value={mode}
            onChange={setMode}
          />
          <Section title="What has your attention?">
            <TaskPicker value={taskId} onChange={setTaskId} optional />
          </Section>
          <Button
            title={`Start ${minutes} minutes`}
            disabled={!focus.hydrated}
            onPress={() => user && focus.start(user.id, taskId || null, mode, minutes)}
          />
        </>
      )}
      {timer && !timer.endedAt && (
        <>
          <Button
            title={timer.deadline ? 'Pause' : 'Resume'}
            onPress={timer.deadline ? focus.pause : focus.resume}
          />
          <Button
            secondary
            title="End session and save time"
            onPress={() => focus.finish(false)}
          />
        </>
      )}
      <ErrorNotice error={save.error} retry={() => save.mutate()} />
      {timer?.endedAt && (
        <>
          <Label>
            {timer.saved
              ? 'Your time has been saved.'
              : 'Your session is kept on this device until it is saved.'}
          </Label>
          {!timer.saved && (
            <Button
              secondary
              title="Retry saving session"
              busy={save.isPending}
              onPress={() => save.mutate()}
            />
          )}
          <Button
            title="Begin another session"
            disabled={!timer.saved}
            onPress={focus.clear}
          />
          <Button
            secondary
            title="Take a short break"
            disabled={!timer.saved}
            onPress={() => {
              focus.clear();
              setMode('SHORT_BREAK');
            }}
          />
        </>
      )}
      <Button
        secondary
        title="Focus preferences"
        onPress={() => router.push('/settings')}
      />
    </Screen>
  );
}
