import { useState } from 'react';
import { View, FlatList, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Plus, Search, SlidersHorizontal } from 'lucide-react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  Screen,
  Header,
  Label,
  Button,
  Chips,
  Empty,
  Loading,
  ErrorNotice,
} from '@/components/ui';
import { TaskRow } from '@/components/TaskRow';
import { api, params } from '@/services/api';
import { useTheme } from '@/theme';
import type { Page, Task, Category } from '@/types';

export default function Tasks() {
  const theme = useTheme();
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('Any priority');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [deadline, setDeadline] = useState('Any deadline');
  const [filters, setFilters] = useState(false);
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
  });
  const query = useInfiniteQuery({
    queryKey: ['tasks', status, search, priority, categoryId, sort, deadline],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api<Page<Task>>(
        `/tasks?${params({
          page: pageParam,
          size: 25,
          search,
          sort,
          categoryId,
          priority: priority === 'Any priority' ? undefined : priority,
          status:
            status === 'All'
              ? undefined
              : (
                  {
                    'To do': 'TODO',
                    'In progress': 'IN_PROGRESS',
                    Completed: 'COMPLETED',
                  } as Record<string, string>
                )[status],
          dueBefore: deadline === 'Overdue' ? new Date().toISOString() : undefined,
        })}`,
      ),
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  });
  const tasks = query.data?.pages.flatMap((page) => page.content) ?? [];
  return (
    <Screen scroll={false}>
      <FlatList
        data={tasks}
        keyExtractor={(task) => task.id}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 40,
          gap: 12,
          maxWidth: 680,
          width: '100%',
          alignSelf: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => query.refetch()}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetching) void query.fetchNextPage();
        }}
        renderItem={({ item }) => <TaskRow task={item} categories={categories.data} />}
        ListHeaderComponent={
          <View style={{ gap: 20, paddingBottom: 12 }}>
            <Header
              title="My tasks"
              subtitle={`${query.data?.pages[0].totalElements ?? 0} tasks in this view`}
              action={
                <Pressable
                  accessibilityLabel="Add task"
                  onPress={() => router.push('/tasks/edit')}
                  style={{
                    backgroundColor: theme.primary,
                    padding: 14,
                    borderRadius: 18,
                  }}
                >
                  <Plus color={theme.primaryInk} size={24} />
                </Pressable>
              }
            />
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                alignItems: 'center',
                backgroundColor: theme.surface,
                paddingHorizontal: 16,
                borderRadius: 16,
              }}
            >
              <Search color={theme.muted} size={20} />
              <TextInput
                accessibilityLabel="Search tasks"
                placeholder="Find a task…"
                placeholderTextColor={theme.muted}
                value={search}
                onChangeText={setSearch}
                style={{
                  flex: 1,
                  minHeight: 54,
                  color: theme.ink,
                  fontFamily: 'Jakarta',
                  fontSize: 15,
                }}
              />
              <Pressable
                accessibilityLabel="Show task filters"
                onPress={() => setFilters(!filters)}
                style={{ padding: 10 }}
              >
                <SlidersHorizontal size={20} color={theme.primary} />
              </Pressable>
            </View>
            <Chips
              values={['All', 'To do', 'In progress', 'Completed']}
              value={status}
              onChange={setStatus}
            />
            {filters && (
              <>
                <Chips
                  values={['Any priority', 'LOW', 'MEDIUM', 'HIGH']}
                  value={priority}
                  onChange={setPriority}
                />
                <Chips
                  values={['Any deadline', 'Overdue']}
                  value={deadline}
                  onChange={setDeadline}
                />
                <Chips
                  values={['createdAt', 'dueAt', 'title', 'priority']}
                  value={sort}
                  onChange={setSort}
                />
                <Chips
                  values={[
                    'All categories',
                    ...(categories.data?.map((category) => category.name) ?? []),
                  ]}
                  value={
                    categories.data?.find((category) => category.id === categoryId)
                      ?.name ?? 'All categories'
                  }
                  onChange={(name) =>
                    setCategoryId(
                      categories.data?.find((category) => category.name === name)?.id ??
                        '',
                    )
                  }
                />
              </>
            )}
            <ErrorNotice error={query.error} retry={() => query.refetch()} />
          </View>
        }
        ListEmptyComponent={
          query.isLoading ? (
            <Loading />
          ) : !query.error ? (
            <Empty
              title={
                search
                  ? 'No matching tasks found.'
                  : 'Every great day starts with a small step.'
              }
              message={
                search
                  ? 'Try another title or adjust your filters.'
                  : 'Capture your first task. The rest can wait.'
              }
              action="Add a task"
              onAction={() => router.push('/tasks/edit')}
            />
          ) : undefined
        }
        ListFooterComponent={query.isFetchingNextPage ? <Loading /> : undefined}
      />
    </Screen>
  );
}
