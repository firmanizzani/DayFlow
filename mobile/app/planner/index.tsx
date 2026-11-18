import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Screen,
  Header,
  Label,
  Button,
  Section,
  ErrorNotice,
  Chips,
} from '@/components/ui';
import { DateField } from '@/components/DateField';
import { TaskPicker } from '@/components/TaskPicker';
import { api, mutate, ApiError } from '@/services/api';
import { usePreferences } from '@/theme';
import { timeLabel } from '@/utils/date';
import type { Task, Page, Plan } from '@/types';

export default function Planner() {
  const route = useLocalSearchParams<{
    taskId?: string;
    sessionId?: string;
    date?: string;
    occurrenceId?: string;
  }>();
  const [taskId, setTaskId] = useState(route.taskId ?? '');
  const [start, setStart] = useState<Date | null>(
    route.date ? new Date(`${route.date}T09:00:00`) : new Date(Date.now() + 3600000),
  );
  const [end, setEnd] = useState<Date | null>(
    new Date((start?.getTime() ?? Date.now()) + 3600000),
  );
  const { data: preferences } = usePreferences();
  const [reminder, setReminder] = useState('15 min before');
  useEffect(() => {
    if (preferences)
      setReminder(
        preferences.defaultReminder === 0
          ? 'At start'
          : `${preferences.defaultReminder} min before`,
      );
  }, [preferences?.defaultReminder]);
  const save = useMutation({
    mutationFn: (allowConflict: boolean) => {
      if (!taskId || !start || !end)
        throw new Error('Choose a task, start time and end time.');
      if (end <= start) throw new Error('End time must be after start time.');
      const minutes =
        reminder === 'No reminder'
          ? null
          : reminder === 'At start'
            ? 0
            : parseInt(reminder);
      return mutate<Plan>(
        route.sessionId
          ? `/planning-sessions/${route.sessionId}/reschedule`
          : '/planning-sessions',
        'POST',
        {
          taskId,
          occurrenceId: route.occurrenceId ?? null,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          reminderMinutesBefore: minutes,
          allowConflict,
        },
      );
    },
    onSuccess: () => router.back(),
  });
  const conflicts =
    save.error instanceof ApiError && save.error.code === 'SCHEDULE_CONFLICT'
      ? (save.error.details as Plan[])
      : null;
  return (
    <Screen>
      <Header
        back
        title={route.sessionId ? 'Find a better moment.' : 'Make space for it.'}
        subtitle="A deadline says when it is due. A plan says when you will do it."
      />
      <Section title="Choose a task">
        <TaskPicker value={taskId} onChange={setTaskId} />
      </Section>
      <DateField
        label="Start time"
        value={start}
        onChange={(value) => {
          setStart(value);
          if (value && (!end || end <= value))
            setEnd(new Date(value.getTime() + 3600000));
        }}
      />
      <DateField label="End time" value={end} onChange={setEnd} />
      <Section title="A gentle reminder">
        <Chips
          values={[
            'No reminder',
            'At start',
            '5 min before',
            '15 min before',
            '30 min before',
            '60 min before',
          ]}
          value={reminder}
          onChange={setReminder}
        />
        {!preferences?.notificationsEnabled && (
          <Label muted size={13}>
            Enable reminders in Settings to receive notifications on this device.
          </Label>
        )}
      </Section>
      <ErrorNotice error={save.error} />
      {conflicts && (
        <View style={{ gap: 12 }}>
          {conflicts.map((plan) => (
            <Label key={plan.id}>
              Already planned: {timeLabel(plan.startAt)}–{timeLabel(plan.endAt)}
            </Label>
          ))}
          <Button
            secondary
            title="Save anyway"
            busy={save.isPending}
            onPress={() => save.mutate(true)}
          />
        </View>
      )}
      <Button
        title={route.sessionId ? 'Reschedule task' : 'Add to my day'}
        busy={save.isPending}
        onPress={() => save.mutate(false)}
      />
    </Screen>
  );
}
