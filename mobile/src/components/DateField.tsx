import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Field, Label, Button } from './ui';
import { useTheme } from '@/theme';

export function DateField({
  label,
  value,
  onChange,
  mode = 'datetime',
  optional = false,
}: {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  mode?: 'date' | 'datetime';
  optional?: boolean;
}) {
  const theme = useTheme();
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!value) {
      setDraft('');
      return;
    }
    const date = [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0'),
    ].join('-');
    const time = [
      String(value.getHours()).padStart(2, '0'),
      String(value.getMinutes()).padStart(2, '0'),
    ].join(':');
    setDraft(mode === 'date' ? date : `${date} ${time}`);
  }, [value?.getTime(), mode]);
  if (Platform.OS === 'web') {
    return (
      <Field
        label={`${label} (${mode === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm'})`}
        placeholder="Not set"
        value={draft}
        onChangeText={setDraft}
        error={error}
        onBlur={() => {
          if (!draft.trim()) {
            onChange(null);
            setError('');
            return;
          }
          const next = new Date(
            draft.replace(' ', 'T') + (mode === 'date' ? 'T12:00:00' : ''),
          );
          if (Number.isNaN(next.getTime())) setError('Enter a valid date and time.');
          else {
            onChange(next);
            setError('');
          }
        }}
      />
    );
  }
  return (
    <View style={{ gap: 8 }}>
      <Label size={14} bold>
        {label}
      </Label>
      <Pressable
        onPress={() => setPicker('date')}
        style={{
          minHeight: 54,
          padding: 16,
          borderRadius: 16,
          backgroundColor: theme.surface,
        }}
      >
        <Label>
          {value
            ? mode === 'date'
              ? value.toLocaleDateString()
              : value.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
            : 'Choose a date'}
        </Label>
      </Pressable>
      {optional && value && (
        <Pressable onPress={() => onChange(null)}>
          <Label color={theme.primary} size={13}>
            Remove date
          </Label>
        </Pressable>
      )}
      {picker && (
        <>
          <DateTimePicker
            value={value ?? new Date()}
            mode={picker}
            themeVariant={theme.isDark ? 'dark' : 'light'}
            onChange={(event, next) => {
              if (Platform.OS === 'android') setPicker(null);
              if (event.type === 'dismissed' || !next) return;
              onChange(next);
              if (picker === 'date' && mode === 'datetime') setPicker('time');
            }}
          />
          {Platform.OS === 'ios' && (
            <Button secondary title="Done" onPress={() => setPicker(null)} />
          )}
        </>
      )}
    </View>
  );
}
