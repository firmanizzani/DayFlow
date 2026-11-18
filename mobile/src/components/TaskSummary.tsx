import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { FlowMotif } from './FlowMotif';
import { ErrorNotice, Label } from './ui';
import { api } from '@/services/api';
import type { Page, Task } from '@/types';

export function TaskSummary({ onFilter }: { onFilter: (status: string) => void }) {
  const query = useQuery({
    queryKey: ['task-summary'],
    queryFn: async () => {
      const [todo, progress, completed] = await Promise.all([
        api<Page<Task>>('/tasks?status=TODO&size=1'),
        api<Page<Task>>('/tasks?status=IN_PROGRESS&size=1'),
        api<Page<Task>>('/tasks?status=COMPLETED&size=1'),
      ]);
      return {
        active: todo.totalElements + progress.totalElements,
        completed: completed.totalElements,
      };
    },
  });
  return (
    <>
      <LinearGradient
        colors={['#393276', '#6551AC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 22, overflow: 'hidden', padding: 22 }}
      >
        <FlowMotif color="#A99BFF" opacity={0.3} />
        <View className="flex-row">
          <View style={{ flex: 1, gap: 2, minHeight: 68 }}>
            <Label size={32} bold color="#FFFFFF">
              {query.data?.active ?? '–'}
            </Label>
            <Label size={14} color="#E8E1FF">
              Active tasks
            </Label>
          </View>
          <View
            style={{ width: 1, backgroundColor: '#9A8BCD', marginHorizontal: 22 }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => onFilter('Completed')}
            style={{ flex: 1, gap: 2, minHeight: 68 }}
          >
            <Label size={32} bold color="#FFFFFF">
              {query.data?.completed ?? '–'}
            </Label>
            <Label size={14} color="#E8E1FF">
              Completed
            </Label>
          </Pressable>
        </View>
      </LinearGradient>
      <ErrorNotice error={query.error} retry={() => query.refetch()} />
    </>
  );
}
