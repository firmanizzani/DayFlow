import { useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, mutate } from '@/services/api';
import { Label, Button, ErrorNotice, Field } from './ui';
import { useTheme } from '@/theme';
import type { Occurrence } from '@/types';

export function Occurrences({ date }: { date: string }) {
  const theme = useTheme();
  const query = useQuery({
    queryKey: ['occurrences', date],
    queryFn: () => api<Occurrence[]>(`/recurring-occurrences?from=${date}&to=${date}`),
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      mutate(`/recurring-occurrences/${id}`, 'PATCH', body),
    onSuccess: () => setEditing(null),
  });
  return (
    <View style={{ gap: 12 }}>
      <ErrorNotice error={query.error ?? update.error} />
      {query.data?.map((item) => (
        <View
          key={item.id}
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 18,
            gap: 12,
          }}
        >
          <Label bold>{item.title}</Label>
          <Label size={12} muted>
            Repeating · {item.status.toLowerCase()}
          </Label>
          <Button
            secondary
            title={
              item.status === 'COMPLETED'
                ? 'Reopen this occurrence'
                : 'Complete this occurrence'
            }
            onPress={() =>
              update.mutate({
                id: item.id,
                body: { status: item.status === 'COMPLETED' ? 'TODO' : 'COMPLETED' },
              })
            }
          />
          <View style={{ flexDirection: 'row', gap: 18 }}>
            <Pressable
              onPress={() => {
                setEditing(item.id);
                setTitle(item.title);
              }}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Label size={13} color={theme.primary}>
                Edit this day
              </Label>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/tasks/recurrence',
                  params: { taskId: item.taskId, ruleId: item.ruleId },
                })
              }
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Label size={13} color={theme.primary}>
                Edit series
              </Label>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/planner',
                  params: { taskId: item.taskId, occurrenceId: item.id, date },
                })
              }
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Label size={13} color={theme.primary}>
                Plan
              </Label>
            </Pressable>
          </View>
          {editing === item.id && (
            <>
              <Field
                label="Title for this occurrence"
                value={title}
                onChangeText={setTitle}
              />
              <Button
                title="Save this day"
                busy={update.isPending}
                onPress={() => update.mutate({ id: item.id, body: { title } })}
              />
            </>
          )}
        </View>
      ))}
      {query.data?.length === 0 && (
        <Label muted>No repeating tasks for this day.</Label>
      )}
    </View>
  );
}
