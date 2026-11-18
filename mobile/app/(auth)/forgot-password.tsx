import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Screen, Header, Field, Button, ErrorNotice, Label } from '@/components/ui';
import { api } from '@/services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const mutation = useMutation({
    mutationFn: () =>
      api('/auth/forgot-password', {
        method: 'POST',
        body: { email },
        anonymous: true,
      }),
  });
  return (
    <Screen>
      <Header
        back
        title="Find your way back."
        subtitle="We will send a password reset link to your email."
      />
      <Field
        label="Email address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <ErrorNotice error={mutation.error} />
      {mutation.isSuccess && (
        <Label>If the account exists, a reset email will be sent.</Label>
      )}
      <Button
        title="Send reset link"
        busy={mutation.isPending}
        onPress={() => mutation.mutate()}
      />
    </Screen>
  );
}
