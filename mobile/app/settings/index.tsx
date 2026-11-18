import { useEffect, useState } from 'react';
import { Alert, Linking, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import {
  Screen,
  Header,
  Label,
  Field,
  Button,
  Section,
  Chips,
  ErrorNotice,
  Surface,
} from '@/components/ui';
import { api, mutate, queryClient } from '@/services/api';
import { clearReminders, requestReminderPermission } from '@/services/notifications';
import { usePreferences, useTheme } from '@/theme';
import { useSession } from '@/store/session';
import { useFocus } from '@/store/focus';
import type { User } from '@/types';

export default function Settings() {
  const session = useSession();
  const theme = useTheme();
  const preferences = usePreferences();
  const [name, setName] = useState(session.user?.name ?? '');
  const [timezone, setTimezone] = useState(session.user?.timezone ?? 'UTC');
  const [focus, setFocus] = useState('25');
  const [shortBreak, setShortBreak] = useState('5');
  const [longBreak, setLongBreak] = useState('15');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [permissionMessage, setPermissionMessage] = useState('');
  useEffect(() => {
    if (!preferences.data) return;
    setFocus(String(preferences.data.focusMinutes));
    setShortBreak(String(preferences.data.shortBreakMinutes));
    setLongBreak(String(preferences.data.longBreakMinutes));
  }, [preferences.data]);
  const update = useMutation({
    mutationFn: (body: unknown) => mutate('/users/me/preferences', 'PATCH', body),
  });
  const profile = useMutation({
    mutationFn: async () => {
      const user = await mutate<User>('/users/me', 'PATCH', { name, timezone });
      const latest = useSession.getState();
      if (latest.accessToken && latest.refreshToken)
        await latest.setSession({
          user,
          accessToken: latest.accessToken,
          refreshToken: latest.refreshToken,
        });
    },
  });
  async function exit() {
    await clearReminders();
    useFocus.getState().clear();
    await session.clear();
    queryClient.clear();
    router.replace('/(auth)/login');
  }
  const logout = useMutation({
    mutationFn: () =>
      api('/auth/logout', {
        method: 'POST',
        anonymous: true,
        body: { refreshToken: session.refreshToken },
      }),
    onSuccess: exit,
  });
  const remove = useMutation({
    mutationFn: () => api('/users/me', { method: 'DELETE' }),
    onSuccess: exit,
  });
  const password = useMutation({
    mutationFn: () =>
      api('/users/me/password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      }),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
    },
  });
  async function toggleNotifications(enabled: boolean) {
    if (enabled && !(await requestReminderPermission())) {
      setPermissionMessage(
        'Notifications are unavailable or permission was denied. You can enable permission in your device settings.',
      );
      return;
    }
    setPermissionMessage('');
    update.mutate({ notificationsEnabled: enabled });
  }
  return (
    <Screen>
      <Header back title="Your space." subtitle={session.user?.email} />
      <Section title="Profile">
        <Field label="Full name" value={name} onChangeText={setName} />
        <Field
          label="Timezone"
          value={timezone}
          onChangeText={setTimezone}
          autoCapitalize="none"
        />
        <Label muted size={12}>
          Use an IANA timezone, for example Asia/Jakarta or Asia/Bangkok.
        </Label>
        <Button
          secondary
          title="Save profile"
          busy={profile.isPending}
          onPress={() => profile.mutate()}
        />
        {profile.isSuccess && <Label color={theme.success}>Profile saved.</Label>}
      </Section>
      <Section title="Make it yours">
        <Chips
          values={['LIGHT', 'DARK', 'SYSTEM'] as const}
          value={preferences.data?.theme ?? 'SYSTEM'}
          onChange={(value) => update.mutate({ theme: value })}
        />
      </Section>
      <Section title="A gentle nudge">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Label>Enable reminders</Label>
          <Switch
            accessibilityLabel="Enable reminders"
            value={preferences.data?.notificationsEnabled ?? false}
            onValueChange={toggleNotifications}
            trackColor={{ true: theme.primary }}
          />
        </View>
        {!!permissionMessage && (
          <>
            <Label muted>{permissionMessage}</Label>
            <Button
              secondary
              title="Open device settings"
              onPress={() => {
                void Linking.openSettings();
              }}
            />
          </>
        )}
        <Label size={14} bold>
          Default reminder (minutes before)
        </Label>
        <Chips
          values={['0', '5', '15', '30', '60']}
          value={String(preferences.data?.defaultReminder ?? 15)}
          onChange={(value) => update.mutate({ defaultReminder: Number(value) })}
        />
      </Section>
      <Section title="Find your pace">
        <Field
          label="Focus duration (1–180 minutes)"
          keyboardType="number-pad"
          value={focus}
          onChangeText={setFocus}
        />
        <Field
          label="Short break (1–60 minutes)"
          keyboardType="number-pad"
          value={shortBreak}
          onChangeText={setShortBreak}
        />
        <Field
          label="Long break (1–120 minutes)"
          keyboardType="number-pad"
          value={longBreak}
          onChangeText={setLongBreak}
        />
        <Button
          secondary
          title="Save focus preferences"
          busy={update.isPending}
          onPress={() =>
            update.mutate({
              focusMinutes: Number(focus),
              shortBreakMinutes: Number(shortBreak),
              longBreakMinutes: Number(longBreak),
            })
          }
        />
      </Section>
      <Button
        secondary
        title="Manage categories"
        onPress={() => router.push('/settings/categories')}
      />
      <Section title="Account security">
        <Field
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <Field
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <Button
          secondary
          title="Change password"
          busy={password.isPending}
          onPress={() => password.mutate()}
        />
        {password.isSuccess && (
          <Label color={theme.success}>
            Password changed. Other refresh sessions have been revoked.
          </Label>
        )}
      </Section>
      <ErrorNotice
        error={
          preferences.error ??
          update.error ??
          profile.error ??
          password.error ??
          logout.error ??
          remove.error
        }
      />
      <Button
        secondary
        title="Sign out"
        busy={logout.isPending}
        onPress={() => logout.mutate()}
      />
      <Button
        danger
        title="Delete my account"
        busy={remove.isPending}
        onPress={() =>
          Alert.alert(
            'Delete your account?',
            'All your tasks, plans, and focus history will be permanently deleted.',
            [
              { text: 'Keep account', style: 'cancel' },
              {
                text: 'Delete account',
                style: 'destructive',
                onPress: () => remove.mutate(),
              },
            ],
          )
        }
      />
    </Screen>
  );
}
