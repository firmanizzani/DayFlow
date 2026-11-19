import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Screen, Header, Button, ErrorNotice, Label } from '@/components/ui';
import { LockKeyhole } from 'lucide-react-native';
import { AuthField } from '@/features/auth/AuthField';
import { useTheme } from '@/theme';
import { api } from '@/services/api';

export default function ResetPassword() {
  const theme = useTheme();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: () =>
      api('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
        anonymous: true,
      }),
  });
  return (
    <Screen>
      <Header
        title="A new beginning."
        subtitle="Choose a password with at least 8 characters."
      />
      <AuthField
        label="New password"
        icon={<LockKeyhole size={19} color={theme.muted} />}
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        autoCapitalize="none"
        autoCorrect={false}
        password
      />
      <ErrorNotice error={mutation.error} />
      {mutation.isSuccess ? (
        <>
          <Label>Your password has been updated.</Label>
          <Button title="Sign in" onPress={() => router.replace('/(auth)/login')} />
        </>
      ) : (
        <Button
          title="Reset password"
          busy={mutation.isPending}
          disabled={!token}
          onPress={() => mutation.mutate()}
        />
      )}
    </Screen>
  );
}
