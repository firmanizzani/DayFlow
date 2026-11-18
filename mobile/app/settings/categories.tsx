import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Screen,
  Header,
  Label,
  Button,
  Field,
  Section,
  ErrorNotice,
} from '@/components/ui';
import { api, mutate } from '@/services/api';
import { useTheme } from '@/theme';
import type { Category } from '@/types';

const colors = ['#7366F0', '#35B895', '#68A6F5', '#EF7180', '#F3B35D', '#393276'];

export default function Categories() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [editing, setEditing] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
  });
  const save = useMutation({
    mutationFn: () =>
      mutate(
        editing ? `/categories/${editing}` : '/categories',
        editing ? 'PATCH' : 'POST',
        { name, color },
      ),
    onSuccess: () => {
      setName('');
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => mutate(`/categories/${id}`, 'DELETE'),
  });
  return (
    <Screen>
      <Header
        back
        title="A place for everything."
        subtitle="Give your tasks a little structure."
      />
      <Section title={editing ? 'Edit category' : 'New category'}>
        <Field
          label="Category name"
          value={name}
          onChangeText={setName}
          placeholder="Work, learning, personal…"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {colors.map((item) => (
            <Pressable
              key={item}
              accessibilityLabel={`Color ${item}`}
              accessibilityState={{ selected: color === item }}
              onPress={() => setColor(item)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: item,
                borderWidth: color === item ? 3 : 0,
                borderColor: theme.ink,
              }}
            />
          ))}
        </View>
        <Button
          title={editing ? 'Save category' : 'Add category'}
          busy={save.isPending}
          disabled={!name.trim()}
          onPress={() => save.mutate()}
        />
        {editing && (
          <Button
            secondary
            title="Cancel edit"
            onPress={() => {
              setEditing(null);
              setName('');
            }}
          />
        )}
      </Section>
      <ErrorNotice error={query.error ?? save.error ?? remove.error} />
      <Section title="Your categories">
        {query.data?.map((category) => (
          <View
            key={category.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              backgroundColor: theme.surface,
              borderRadius: 16,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: category.color,
              }}
            />
            <View style={{ flex: 1 }}>
              <Label bold>{category.name}</Label>
            </View>
            <Pressable
              onPress={() => {
                setEditing(category.id);
                setName(category.name);
                setColor(category.color);
              }}
              style={{ padding: 12 }}
            >
              <Label size={13} color={theme.primary}>
                Edit
              </Label>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert('Delete category?', 'Tasks will become uncategorized.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => remove.mutate(category.id),
                  },
                ])
              }
              style={{ padding: 12 }}
            >
              <Label size={13} color={theme.danger}>
                Delete
              </Label>
            </Pressable>
          </View>
        ))}
        {query.data?.length === 0 && (
          <Label muted>No categories yet. Tasks can also stay uncategorized.</Label>
        )}
      </Section>
    </Screen>
  );
}
