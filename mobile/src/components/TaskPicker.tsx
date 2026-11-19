import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useTheme } from '@/theme';
import { Label, Field, Button, ErrorNotice, Loading } from './ui';
import type { Page, Task } from '@/types';

export function TaskPicker({
  value,
  onChange,
  optional = false,
}: {
  value: string;
  onChange: (id: string) => void;
  optional?: boolean;
}) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(!value);
  const selected = useQuery({
    queryKey: ['task', value],
    queryFn: () => api<Task>(`/tasks/${value}`),
    enabled: !!value,
  });
  const query = useQuery({
    queryKey: ['task-picker', search],
    queryFn: () =>
      api<Page<Task>>(`/tasks?size=8&search=${encodeURIComponent(search)}`),
    enabled: expanded,
  });
  return (
    <View className="gap-3">
      {!!value && (
        <Button
          secondary
          title={selected.data?.title ?? 'Selected task'}
          onPress={() => setExpanded(!expanded)}
        />
      )}
      {expanded && (
        <>
          <Field
            label="Find a task"
            placeholder="Search your tasks…"
            value={search}
            onChangeText={setSearch}
          />
          {optional && (
            <Button
              secondary
              title="Focus without a task"
              onPress={() => {
                onChange('');
                setExpanded(false);
              }}
            />
          )}
          {query.isLoading && <Loading />}
          {query.data?.content.map((task) => (
            <Pressable
              key={task.id}
              accessibilityRole="button"
              onPress={() => {
                onChange(task.id);
                setExpanded(false);
              }}
              style={{
                padding: 16,
                minHeight: 48,
                borderRadius: 14,
                backgroundColor: task.id === value ? theme.soft : theme.surface,
              }}
            >
              <Label bold={task.id === value}>{task.title}</Label>
            </Pressable>
          ))}
          {query.data?.content.length === 0 && (
            <Label muted>No matching tasks found.</Label>
          )}
        </>
      )}
      {!value && !expanded && (
        <Button
          secondary
          title="Choose a task (optional)"
          onPress={() => setExpanded(true)}
        />
      )}
      <ErrorNotice error={selected.error ?? query.error} />
    </View>
  );
}
