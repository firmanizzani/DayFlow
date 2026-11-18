import { useEffect, useState } from 'react';
import {
  AppState,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Settings,
  ListTodo,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { Label } from '@/components/ui';
import { FlowMotif } from '@/components/FlowMotif';
import { TaskPicker } from '@/components/TaskPicker';
import { useFocus, type FocusMode } from '@/store/focus';
import { useSession } from '@/store/session';
import { usePreferences } from '@/theme';
import { api, mutate } from '@/services/api';
import { remainingSeconds } from '@/utils/date';
import type { Task } from '@/types';
import { StatusBar } from 'expo-status-bar';

const modes = [
  { value: 'FOCUS', title: 'Focus' },
  { value: 'SHORT_BREAK', title: 'Short break' },
  { value: 'LONG_BREAK', title: 'Long break' },
] as const;

export default function Focus() {
  const route = useLocalSearchParams<{ taskId?: string }>();
  const [taskId, setTaskId] = useState(route.taskId ?? '');
  const [mode, setMode] = useState<FocusMode>('FOCUS');
  const [now, setNow] = useState(Date.now());
  const [showPicker, setShowPicker] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const size = Math.min(318, width - 48);
  const center = size / 2;
  const radius = center - 16;
  const circumference = Math.PI * 2 * radius;
  const user = useSession((state) => state.user);
  const focus = useFocus();
  const timer = focus.timer?.userId === user?.id ? focus.timer : null;
  const { data: preferences } = usePreferences();
  const activeMode = timer?.mode ?? mode;
  const minutes =
    activeMode === 'FOCUS'
      ? (preferences?.focusMinutes ?? 25)
      : activeMode === 'SHORT_BREAK'
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
  const activeTask = timer?.taskId ?? taskId;
  const task = useQuery({
    queryKey: ['task', activeTask],
    queryFn: () => api<Task>('/tasks/' + activeTask),
    enabled: !!activeTask,
  });
  const save = useMutation({
    mutationFn: async () => {
      if (!timer?.endedAt) return;
      const duration = Math.floor(timer.totalSeconds - timer.remaining);
      if (duration > 0)
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
    onSuccess: focus.markSaved,
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
    if (resetRequested && timer?.saved) {
      focus.clear();
      setResetRequested(false);
    }
  }, [resetRequested, timer?.saved]);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  return (
    <LinearGradient
      colors={['#39315F', '#403478', '#292142']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar style="light" />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 70,
          height: height * 0.4,
        }}
      >
        <FlowMotif color="#9981DD" opacity={0.22} />
      </View>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            minHeight: height - insets.top - insets.bottom,
            padding: 24,
            paddingBottom: 32,
            gap: 26,
            maxWidth: 560,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityLabel="Leave focus timer"
              onPress={goBack}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 22,
                backgroundColor: '#FFFFFF14',
              }}
            >
              <ArrowLeft color="#FFFFFF" size={23} />
            </Pressable>
            <Label size={22} bold color="#FFFFFF" heading>
              Focus
            </Label>
            <Pressable
              accessibilityLabel="Focus settings"
              onPress={() => router.push('/settings/focus-preferences')}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings color="#E9E1FF" size={22} />
            </Pressable>
          </View>
          <View
            className="flex-row"
            style={{ padding: 5, borderRadius: 24, backgroundColor: '#FFFFFF18' }}
          >
            {modes.map((item) => (
              <Pressable
                key={item.value}
                accessibilityRole="button"
                accessibilityState={{
                  selected: activeMode === item.value,
                  disabled: !!timer,
                }}
                disabled={!!timer}
                onPress={() => setMode(item.value)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 22,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor:
                    activeMode === item.value ? '#FFFFFF' : 'transparent',
                }}
              >
                <Label
                  size={12}
                  bold
                  color={activeMode === item.value ? '#393276' : '#E7DFFF'}
                >
                  {item.title}
                </Label>
              </Pressable>
            ))}
          </View>
          <View
            style={{
              flex: 1,
              minHeight: 320,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 28,
            }}
          >
            <View
              style={{
                width: size,
                height: size,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Svg
                width={size}
                height={size}
                style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
              >
                <Circle
                  cx={center}
                  cy={center}
                  r={radius + 8}
                  stroke="#A28ECC"
                  strokeWidth={1.5}
                  fill="transparent"
                />
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#77649E"
                  strokeWidth={7}
                  fill="transparent"
                />
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#DAD0FF"
                  strokeWidth={7}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - remaining / total)}
                  strokeLinecap="round"
                />
              </Svg>
              <Label size={width < 360 ? 52 : 64} bold color="#FFFFFF">
                {String(Math.floor(remaining / 60)).padStart(2, '0') +
                  ':' +
                  String(remaining % 60).padStart(2, '0')}
              </Label>
              <Label size={15} color="#E8E0FF">
                {timer?.endedAt
                  ? timer.completed
                    ? 'Session complete'
                    : 'Session ended'
                  : timer && !timer.deadline
                    ? 'Paused — take your time'
                    : modes.find((item) => item.value === activeMode)?.title +
                      ' session'}
              </Label>
            </View>
            <Pressable
              accessibilityLabel="Choose a focus task"
              disabled={!!timer}
              onPress={() => setShowPicker(!showPicker)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 48,
                maxWidth: 290,
                paddingHorizontal: 12,
              }}
            >
              <ListTodo size={24} color="#E6DDFF" />
              <Label size={17} bold color="#FFFFFF">
                {task.data?.title ?? 'Choose a task, or simply begin.'}
              </Label>
            </Pressable>
          </View>
          {showPicker && !timer && (
            <View style={{ backgroundColor: '#F8F9FD', padding: 16, borderRadius: 20 }}>
              <TaskPicker
                value={taskId}
                onChange={(id) => {
                  setTaskId(id);
                  setShowPicker(false);
                }}
                optional
              />
            </View>
          )}
          {!!save.error && <Label color="#FFD1D8">{save.error.message}</Label>}
          <View style={{ gap: 12, paddingHorizontal: 20 }}>
            {!timer && (
              <Pressable
                accessibilityRole="button"
                disabled={!focus.hydrated}
                onPress={() =>
                  user && focus.start(user.id, taskId || null, mode, minutes)
                }
                style={{
                  minHeight: 56,
                  borderRadius: 28,
                  backgroundColor: '#FFFFFF',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <Play size={20} color="#6251BB" />
                <Label bold color="#6251BB">
                  Start {modes.find((item) => item.value === mode)?.title.toLowerCase()}
                </Label>
              </Pressable>
            )}
            {timer && !timer.endedAt && (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={timer.deadline ? focus.pause : focus.resume}
                  style={{
                    minHeight: 56,
                    borderRadius: 28,
                    backgroundColor: '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  {timer.deadline ? (
                    <Pause size={20} color="#6251BB" />
                  ) : (
                    <Play size={20} color="#6251BB" />
                  )}
                  <Label bold color="#6251BB">
                    {timer.deadline ? 'Pause' : 'Resume'}
                  </Label>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => focus.finish(false)}
                  style={{
                    minHeight: 48,
                    borderRadius: 24,
                    backgroundColor: '#FFFFFF17',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Label color="#FFFFFF">End session</Label>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setResetRequested(true);
                    focus.finish(false);
                  }}
                  style={{
                    minHeight: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <RotateCcw size={15} color="#E8E0FF" />
                  <Label size={13} color="#E8E0FF">
                    Reset timer
                  </Label>
                </Pressable>
              </>
            )}
            {timer?.endedAt && (
              <>
                <Label color="#E8E0FF">
                  {timer.saved
                    ? 'Your time has been saved.'
                    : 'Keeping your time safe until it is saved.'}
                </Label>
                <Pressable
                  accessibilityRole="button"
                  onPress={timer.saved ? focus.clear : () => save.mutate()}
                  style={{
                    minHeight: 56,
                    borderRadius: 28,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Label bold color="#6251BB">
                    {timer.saved
                      ? 'Begin another session'
                      : save.isPending
                        ? 'Saving…'
                        : 'Retry saving'}
                  </Label>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
