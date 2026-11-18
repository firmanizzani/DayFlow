import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Screen, Header, Field, Button, ErrorNotice, Label } from '@/components/ui';
import { usePreferences } from '@/theme';
import { mutate } from '@/services/api';

export default function FocusPreferences() {
  const preferences = usePreferences();
  const [focus, setFocus] = useState('25');
  const [shortBreak, setShortBreak] = useState('5');
  const [longBreak, setLongBreak] = useState('15');
  useEffect(() => {
    if (!preferences.data) return;
    setFocus(String(preferences.data.focusMinutes));
    setShortBreak(String(preferences.data.shortBreakMinutes));
    setLongBreak(String(preferences.data.longBreakMinutes));
  }, [preferences.data]);
  const save = useMutation({
    mutationFn: () =>
      mutate('/users/me/preferences', 'PATCH', {
        focusMinutes: Number(focus),
        shortBreakMinutes: Number(shortBreak),
        longBreakMinutes: Number(longBreak),
      }),
  });
  return (
    <Screen>
      <Header
        back
        title="Find your pace"
        subtitle="A rhythm that leaves room to rest."
      />
      <Field
        label="Focus (1–180 minutes)"
        value={focus}
        onChangeText={setFocus}
        keyboardType="number-pad"
      />
      <Field
        label="Short break (1–60 minutes)"
        value={shortBreak}
        onChangeText={setShortBreak}
        keyboardType="number-pad"
      />
      <Field
        label="Long break (1–120 minutes)"
        value={longBreak}
        onChangeText={setLongBreak}
        keyboardType="number-pad"
      />
      <ErrorNotice error={preferences.error ?? save.error} />
      {save.isSuccess && <Label>Your focus preferences are saved.</Label>}
      <Button
        title="Save preferences"
        busy={save.isPending}
        onPress={() => save.mutate()}
      />
    </Screen>
  );
}
