import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Screen, Header, Field, Button, ErrorNotice, Label } from '@/components/ui';
import { api } from '@/services/api';

export default function ResetPassword() {
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
      <Field
        label="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
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
