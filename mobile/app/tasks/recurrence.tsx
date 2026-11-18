import { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Screen,
  Header,
  Label,
  Field,
  Chips,
  Button,
  Section,
  ErrorNotice,
} from '@/components/ui';
import { DateField } from '@/components/DateField';
import { api, mutate } from '@/services/api';
import { useTheme } from '@/theme';
import { dateKey } from '@/utils/date';
import type { Rule } from '@/types';

export default function Recurrence() {
  const { taskId, ruleId } = useLocalSearchParams<{
    taskId: string;
    ruleId?: string;
  }>();
  const theme = useTheme();
  const [frequency, setFrequency] = useState('DAILY');
  const [interval, setInterval] = useState('1');
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [start, setStart] = useState<Date | null>(new Date());
  const [end, setEnd] = useState<Date | null>(null);
  const rules = useQuery({
    queryKey: ['rules'],
    queryFn: () => api<Rule[]>('/recurring-rules'),
  });
  useEffect(() => {
    const rule = rules.data?.find((item) => item.id === ruleId);
    if (!rule) return;
    setFrequency(rule.frequency);
    setInterval(String(rule.repeatInterval));
    setStart(new Date(`${rule.startDate}T12:00:00`));
    setEnd(rule.endDate ? new Date(`${rule.endDate}T12:00:00`) : null);
    setDays(rule.weekdays.split(',').filter(Boolean).map(Number));
  }, [rules.data, ruleId]);
  const save = useMutation({
    mutationFn: () => {
      if (!start || !Number.isInteger(Number(interval)))
        throw new Error('Choose a start date and a whole number interval.');
      return mutate(
        ruleId ? `/recurring-rules/${ruleId}` : '/recurring-rules',
        ruleId ? 'PATCH' : 'POST',
        {
          taskId,
          frequency,
          repeatInterval: Number(interval),
          weekdays: days,
          startDate: dateKey(start),
          endDate: end ? dateKey(end) : null,
          active: true,
        },
      );
    },
    onSuccess: () => router.back(),
  });
  const stop = useMutation({
    mutationFn: () => mutate(`/recurring-rules/${ruleId}`, 'DELETE'),
    onSuccess: () => router.back(),
  });
  return (
    <Screen>
      <Header
        back
        title="Build a little rhythm."
        subtitle="Each day is a fresh occurrence with its own progress."
      />
      <Chips
        values={['DAILY', 'WEEKLY', 'MONTHLY']}
        value={frequency}
        onChange={setFrequency}
      />
      <Field
        label={`Repeat every (${frequency === 'DAILY' ? 'days' : frequency === 'WEEKLY' ? 'weeks' : 'months'})`}
        value={interval}
        onChangeText={setInterval}
        keyboardType="number-pad"
      />
      {frequency === 'WEEKLY' && (
        <Section title="On these days">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, index) => (
              <Pressable
                key={name}
                onPress={() =>
                  setDays(
                    days.includes(index + 1)
                      ? days.filter((day) => day !== index + 1)
                      : [...days, index + 1],
                  )
                }
                style={{
                  padding: 12,
                  minHeight: 44,
                  backgroundColor: days.includes(index + 1)
                    ? theme.primary
                    : theme.surface,
                  borderRadius: 12,
                }}
              >
                <Label color={days.includes(index + 1) ? theme.primaryInk : theme.ink}>
                  {name}
                </Label>
              </Pressable>
            ))}
          </View>
        </Section>
      )}
      <DateField label="Start date" value={start} onChange={setStart} mode="date" />
      <DateField
        label="End date (optional)"
        value={end}
        onChange={setEnd}
        mode="date"
        optional
      />
      <ErrorNotice error={save.error ?? stop.error} />
      <Button
        title="Save repeat schedule"
        busy={save.isPending}
        onPress={() => save.mutate()}
      />
      {ruleId && (
        <Button
          danger
          title="Stop repeating"
          busy={stop.isPending}
          onPress={() => stop.mutate()}
        />
      )}
    </Screen>
  );
}
