import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Screen,
  Header,
  Field,
  Button,
  Chips,
  ErrorNotice,
  Section,
  Loading,
} from '@/components/ui';
import { DateField } from '@/components/DateField';
import { api, mutate } from '@/services/api';
import type { Category, Task } from '@/types';

const schema = z.object({
  title: z.string().trim().min(1, 'Give your task a title.').max(150),
  description: z.string().max(10000),
});

export default function TaskEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [priority, setPriority] = useState('MEDIUM');
  const [categoryId, setCategoryId] = useState('');
  const [due, setDue] = useState<Date | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
  });
  const task = useQuery({
    queryKey: ['task', id],
    queryFn: () => api<Task>(`/tasks/${id}`),
    enabled: !!id,
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
  });
  useEffect(() => {
    if (!task.data) return;
    form.reset({ title: task.data.title, description: task.data.description ?? '' });
    setPriority(task.data.priority);
    setCategoryId(task.data.categoryId ?? '');
    setDue(task.data.dueAt ? new Date(task.data.dueAt) : null);
    setAdvanced(true);
  }, [task.data]);
  const save = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      mutate<Task>(id ? `/tasks/${id}` : '/tasks', id ? 'PATCH' : 'POST', {
        ...values,
        priority,
        categoryId: categoryId || null,
        dueAt: due?.toISOString() ?? null,
      }),
    onSuccess: (result) => {
      if (id) router.back();
      else router.replace({ pathname: '/tasks/[id]', params: { id: result.id } });
    },
  });
  return (
    <Screen>
      <Header
        back
        title={id ? 'A little adjustment.' : 'What’s on your mind?'}
        subtitle="Start with a title. Make a plan when you’re ready."
      />
      {task.isLoading && <Loading />}
      <Controller
        control={form.control}
        name="title"
        render={({ field, fieldState }) => (
          <Field
            label="Task title"
            placeholder="What would you like to do?"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            autoFocus={!id}
          />
        )}
      />
      <Controller
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <Field
            label="A few notes (optional)"
            placeholder="Ideas, context, a place to start…"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            multiline
          />
        )}
      />
      <Button
        secondary
        title={advanced ? 'Hide task options' : 'Add category, priority or deadline'}
        onPress={() => setAdvanced(!advanced)}
      />
      {advanced && (
        <>
          <Section title="Priority">
            <Chips
              values={['LOW', 'MEDIUM', 'HIGH']}
              value={priority}
              onChange={setPriority}
            />
          </Section>
          <Section
            title="Category"
            action="Manage"
            onAction={() => router.push('/settings/categories')}
          >
            <Chips
              values={[
                'Uncategorized',
                ...(categories.data?.map((category) => category.name) ?? []),
              ]}
              value={
                categories.data?.find((category) => category.id === categoryId)?.name ??
                'Uncategorized'
              }
              onChange={(name) =>
                setCategoryId(
                  categories.data?.find((category) => category.name === name)?.id ?? '',
                )
              }
            />
          </Section>
          <DateField
            label="Deadline (optional)"
            value={due}
            onChange={setDue}
            optional
          />
        </>
      )}
      <ErrorNotice error={task.error ?? save.error} />
      <Button
        title={id ? 'Save changes' : 'Create task'}
        busy={save.isPending}
        onPress={form.handleSubmit((values) => save.mutate(values))}
      />
    </Screen>
  );
}
