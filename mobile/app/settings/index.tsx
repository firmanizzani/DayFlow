import { useState } from 'react';
import { Alert, Linking, Pressable, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Bell, Timer, Layers, ShieldCheck, ChevronRight } from 'lucide-react-native';
import {
  Screen,
  Header,
  Label,
  Button,
  Section,
  Chips,
  ErrorNotice,
} from '@/components/ui';
import { SettingsGroup, SettingsRow } from '@/components/SettingsRow';
import { api, mutate } from '@/services/api';
import { endLocalSession } from '@/services/account';
import { requestReminderPermission } from '@/services/notifications';
import { usePreferences, useTheme } from '@/theme';
import { useSession } from '@/store/session';

export default function Settings() {
  const user = useSession((state) => state.user);
  const theme = useTheme();
  const preferences = usePreferences();
  const [permissionMessage, setPermissionMessage] = useState('');
  const update = useMutation({
    mutationFn: (body: unknown) => mutate('/users/me/preferences', 'PATCH', body),
  });
  const logout = useMutation({
    mutationFn: () =>
      api('/auth/logout', {
        method: 'POST',
        anonymous: true,
        body: { refreshToken: useSession.getState().refreshToken },
      }),
    onSettled: endLocalSession,
  });
  const remove = useMutation({
    mutationFn: () => api('/users/me', { method: 'DELETE' }),
    onSuccess: endLocalSession,
  });
  async function toggleNotifications(enabled: boolean) {
    if (enabled && !(await requestReminderPermission())) {
      setPermissionMessage(
        'Notifications are unavailable or permission was denied. Enable permission in your device settings.',
      );
      return;
    }
    setPermissionMessage('');
    update.mutate({ notificationsEnabled: enabled });
  }
  return (
    <Screen>
      <Header back title="Settings" />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/settings/profile')}
        style={{
          backgroundColor: theme.surface,
          borderRadius: 22,
          padding: 20,
          borderWidth: 1,
          borderColor: theme.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: theme.soft,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Label size={27} bold color={theme.primary}>
            {user?.name.slice(0, 1).toUpperCase()}
          </Label>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Label bold size={18}>
            {user?.name}
          </Label>
          <Label muted size={13} lines={1}>
            {user?.email}
          </Label>
        </View>
        <ChevronRight size={18} color={theme.muted} />
      </Pressable>
      <Section title="Appearance">
        <Chips
          values={['Light', 'Dark', 'System']}
          value={
            preferences.data?.theme === 'LIGHT'
              ? 'Light'
              : preferences.data?.theme === 'DARK'
                ? 'Dark'
                : 'System'
          }
          onChange={(value) => update.mutate({ theme: value.toUpperCase() })}
        />
      </Section>
      <SettingsGroup>
        <SettingsRow
          icon={Bell}
          title="Reminders"
          detail="A little nudge for your plans"
          trailing={
            <Switch
              accessibilityLabel="Enable reminders"
              value={preferences.data?.notificationsEnabled ?? false}
              onValueChange={toggleNotifications}
              trackColor={{ true: theme.primary }}
            />
          }
        />
        <SettingsRow
          icon={Timer}
          title="Focus duration"
          detail={'Default: ' + (preferences.data?.focusMinutes ?? 25) + ' minutes'}
          onPress={() => router.push('/settings/focus-preferences')}
        />
        <SettingsRow
          icon={Layers}
          title="Task categories"
          detail="Make space for work and life"
          onPress={() => router.push('/settings/categories')}
          last
        />
      </SettingsGroup>
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
      {preferences.data?.notificationsEnabled && (
        <Section title="Remind me before my plan">
          <Chips
            values={['0', '5', '15', '30', '60']}
            value={String(preferences.data.defaultReminder)}
            onChange={(value) => update.mutate({ defaultReminder: Number(value) })}
          />
          <Label muted size={12}>
            Minutes before the start. Zero means at start time.
          </Label>
        </Section>
      )}
      <SettingsGroup>
        <SettingsRow
          icon={ShieldCheck}
          title="Account security"
          detail="Change your password"
          onPress={() => router.push('/settings/security')}
          last
        />
      </SettingsGroup>
      <ErrorNotice error={preferences.error ?? update.error ?? remove.error} />
      <Button
        secondary
        title="Sign out"
        busy={logout.isPending}
        onPress={() => logout.mutate()}
      />
      <Pressable
        accessibilityRole="button"
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
        style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
      >
        <Label size={13} color={theme.danger}>
          Delete my account
        </Label>
      </Pressable>
    </Screen>
  );
}
