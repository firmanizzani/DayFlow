import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check } from 'lucide-react-native';
import {
  Screen,
  Header,
  Label,
  Button,
  Section,
  Field,
  Surface,
  ErrorNotice,
  Loading,
  Chips,
} from '@/components/ui';
import { api, mutate, params } from '@/services/api';
import { useTheme } from '@/theme';
import { addDays, timeLabel, shortDate } from '@/utils/date';
import type { Task, Subtask, Plan, Rule, Category } from '@/types';

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [subtask, setSubtask] = useState('');
  const [editingStep, setEditingStep] = useState<{ id: string; title: string } | null>(
    null,
  );
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
  });
  const task = useQuery({
    queryKey: ['task', id],
    queryFn: () => api<Task>(`/tasks/${id}`),
  });
  const subtasks = useQuery({
    queryKey: ['subtasks', id],
    queryFn: () => api<Subtask[]>(`/tasks/${id}/subtasks`),
  });
  const rules = useQuery({
    queryKey: ['rules'],
    queryFn: () => api<Rule[]>('/recurring-rules'),
  });
  const plans = useQuery({
    queryKey: ['task-plans', id],
    queryFn: () =>
      api<Plan[]>(
        `/planning-sessions?${params({ from: addDays(new Date(), -180).toISOString(), to: addDays(new Date(), 180).toISOString() })}`,
      ),
  });
  const focus = useQuery({
    queryKey: ['task-focus', id],
    queryFn: () =>
      api<
        {
          id: string;
          taskId: string | null;
          durationSeconds: number;
          startedAt: string;
        }[]
      >(
        `/focus-sessions?${params({ from: addDays(new Date(), -180).toISOString(), to: new Date().toISOString() })}`,
      ),
  });
  const action = useMutation({
    mutationFn: ({
      path,
      method,
      body,
    }: {
      path: string;
      method: 'POST' | 'PATCH' | 'DELETE';
      body?: unknown;
    }) => mutate(path, method, body),
  });
  const rule = rules.data?.find((item) => item.taskId === id && item.active);
  const data = task.data;
  function remove() {
    Alert.alert(
      'Delete this task?',
      'Its subtasks and planning sessions will also be removed.',
      [
        { text: 'Keep task', style: 'cancel' },
        {
          text: 'Delete task',
          style: 'destructive',
          onPress: () =>
            action.mutate(
              { path: `/tasks/${id}`, method: 'DELETE' },
              { onSuccess: () => router.replace('/(tabs)/tasks') },
            ),
        },
      ],
    );
  }
  return (
    <Screen>
      <Header
        back
        title={data?.title ?? 'Your task'}
        subtitle={
          data
            ? `${data.priority.toLowerCase()} priority${data.dueAt ? ` · Due ${new Date(data.dueAt).toLocaleString()}` : ' · No deadline'}`
            : undefined
        }
      />
      <ErrorNotice error={task.error ?? action.error} retry={() => task.refetch()} />
      {task.isLoading && <Loading />}
      {data && (
        <>
          <Chips
            values={['TODO', 'IN_PROGRESS', 'COMPLETED']}
            value={data.status}
            onChange={(status) =>
              action.mutate({
                path: `/tasks/${id}/status`,
                method: 'PATCH',
                body: { status },
              })
            }
          />
          <Label muted size={13}>
            {categories.data?.find((category) => category.id === data.categoryId)
              ?.name ?? 'Uncategorized'}
          </Label>
          {data.description && <Label>{data.description}</Label>}
          <Button
            title={data.status === 'COMPLETED' ? 'Reopen task' : 'Mark as complete'}
            busy={action.isPending}
            onPress={() =>
              action.mutate({
                path: `/tasks/${id}/status`,
                method: 'PATCH',
                body: { status: data.status === 'COMPLETED' ? 'TODO' : 'COMPLETED' },
              })
            }
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Button
                secondary
                title="Add to planner"
                onPress={() =>
                  router.push({ pathname: '/planner', params: { taskId: id } })
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                secondary
                title="Start focus"
                onPress={() =>
                  router.push({ pathname: '/focus', params: { taskId: id } })
                }
              />
            </View>
          </View>
          <Section
            title={`Small steps · ${subtasks.data?.filter((item) => item.isCompleted).length ?? 0}/${subtasks.data?.length ?? 0}`}
          >
            {subtasks.data?.map((item) => (
              <View
                key={item.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.isCompleted }}
                  onPress={() =>
                    action.mutate({
                      path: `/subtasks/${item.id}`,
                      method: 'PATCH',
                      body: { isCompleted: !item.isCompleted },
                    })
                  }
                  style={{
                    flex: 1,
                    minHeight: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      backgroundColor: item.isCompleted ? theme.primary : theme.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.isCompleted && <Check size={15} color={theme.primaryInk} />}
                  </View>
                  <Label>{item.title}</Label>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Rename subtask ${item.title}`}
                  onPress={() => setEditingStep({ id: item.id, title: item.title })}
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Label size={12} color={theme.primary}>
                    Edit
                  </Label>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Delete subtask ${item.title}`}
                  onPress={() =>
                    action.mutate({ path: `/subtasks/${item.id}`, method: 'DELETE' })
                  }
                  style={{ padding: 12 }}
                >
                  <Label size={12} muted>
                    Remove
                  </Label>
                </Pressable>
              </View>
            ))}
            {editingStep && (
              <>
                <Field
                  label="Rename step"
                  value={editingStep.title}
                  onChangeText={(title) => setEditingStep({ ...editingStep, title })}
                />
                <Button
                  title="Save step"
                  busy={action.isPending}
                  onPress={() =>
                    action.mutate(
                      {
                        path: `/subtasks/${editingStep.id}`,
                        method: 'PATCH',
                        body: { title: editingStep.title },
                      },
                      { onSuccess: () => setEditingStep(null) },
                    )
                  }
                />
                <Button
                  secondary
                  title="Cancel rename"
                  onPress={() => setEditingStep(null)}
                />
              </>
            )}
            <Field
              label="Add a small step"
              value={subtask}
              onChangeText={setSubtask}
              placeholder="Break it down…"
            />
            <Button
              secondary
              title="Add subtask"
              disabled={!subtask.trim()}
              onPress={() =>
                action.mutate(
                  {
                    path: `/tasks/${id}/subtasks`,
                    method: 'POST',
                    body: { title: subtask },
                  },
                  { onSuccess: () => setSubtask('') },
                )
              }
            />
          </Section>
          <Section title="Planning sessions">
            {plans.data
              ?.filter((plan) => plan.taskId === id)
              .map((plan) => (
                <Surface key={plan.id}>
                  <Label bold>
                    {shortDate(plan.startAt)} · {timeLabel(plan.startAt)}–
                    {timeLabel(plan.endAt)}
                  </Label>
                  <Label muted size={13}>
                    {plan.status.toLowerCase()}
                  </Label>
                  {plan.status === 'PLANNED' && (
                    <>
                      <Button
                        secondary
                        title="Reschedule"
                        onPress={() =>
                          router.push({
                            pathname: '/planner',
                            params: { taskId: id, sessionId: plan.id },
                          })
                        }
                      />
                      <Button
                        secondary
                        title="Session complete"
                        onPress={() =>
                          action.mutate({
                            path: `/planning-sessions/${plan.id}/status`,
                            method: 'PATCH',
                            body: { status: 'COMPLETED' },
                          })
                        }
                      />
                      <Button
                        secondary
                        title="Return to unscheduled"
                        onPress={() =>
                          action.mutate({
                            path: `/planning-sessions/${plan.id}`,
                            method: 'DELETE',
                          })
                        }
                      />
                    </>
                  )}
                </Surface>
              ))}
            {!plans.data?.some((plan) => plan.taskId === id) && (
              <Label muted>No time blocks yet. The task is ready when you are.</Label>
            )}
          </Section>
          <Section
            title="Make it a rhythm"
            action={rule ? 'Edit series' : 'Set repeat'}
            onAction={() =>
              router.push({
                pathname: '/tasks/recurrence',
                params: { taskId: id, ruleId: rule?.id },
              })
            }
          >
            <Label muted>
              {rule
                ? `Repeats ${rule.frequency.toLowerCase()} · every ${rule.repeatInterval}`
                : 'This task does not repeat.'}
            </Label>
          </Section>
          <Section title="Time well spent">
            {focus.data
              ?.filter((session) => session.taskId === id)
              .map((session) => (
                <Label key={session.id} muted>
                  {shortDate(session.startedAt)} ·{' '}
                  {Math.floor(session.durationSeconds / 60)} min of focus
                </Label>
              ))}
            {!focus.data?.some((session) => session.taskId === id) && (
              <Label muted>No focus sessions yet.</Label>
            )}
          </Section>
          <Button
            secondary
            title="Edit task"
            onPress={() => router.push({ pathname: '/tasks/edit', params: { id } })}
          />
          <Button danger title="Delete task" onPress={remove} />
        </>
      )}
    </Screen>
  );
}
