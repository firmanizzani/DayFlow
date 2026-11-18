import { useEffect, useState } from 'react';
import { View, FlatList, Keyboard, Pressable, TextInput } from 'react-native';
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
import { TaskSummary } from '@/components/TaskSummary';
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
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
          padding: 20,
          paddingBottom: 112,
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
            />
            <TaskSummary onFilter={setStatus} />
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
      {!keyboardVisible && (
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 16 }}
        >
          <View
            pointerEvents="box-none"
            style={{
              width: '100%',
              maxWidth: 680,
              alignSelf: 'center',
              paddingHorizontal: 20,
              alignItems: 'flex-end',
            }}
          >
            <Pressable
              cssInterop={false}
              accessibilityRole="button"
              accessibilityLabel="Add task"
              testID="tasks-add-floating"
              onPress={() => router.push('/tasks/edit')}
              style={({ pressed }) => ({
                width: 56,
                height: 56,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.isDark ? theme.primary : '#6553DB',
                shadowColor: '#29234C',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: theme.isDark ? 0.25 : 0.18,
                shadowRadius: 12,
                elevation: 6,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Plus color={theme.primaryInk} size={27} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      )}
    </Screen>
  );
}
