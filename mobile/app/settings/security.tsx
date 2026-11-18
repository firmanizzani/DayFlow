import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Screen, Header, Field, Label, Button, ErrorNotice } from '@/components/ui';
import { api } from '@/services/api';
import { endLocalSession } from '@/services/account';

export default function Security() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const save = useMutation({
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
  return (
    <Screen>
      <Header
        back
        title="Account security"
        subtitle="Change your password and keep your space private."
      />
      <Field
        label="Current password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        autoComplete="current-password"
        secureTextEntry
      />
      <Field
        label="New password"
        value={newPassword}
        onChangeText={setNewPassword}
        autoComplete="new-password"
        secureTextEntry
      />
      <Label muted size={13}>
        Use at least 8 characters. Changing your password revokes your refresh sessions.
      </Label>
      <ErrorNotice error={save.error} />
      {save.isSuccess ? (
        <>
          <Label>Password changed. Sign in again to continue.</Label>
          <Button title="Return to sign in" onPress={endLocalSession} />
        </>
      ) : (
        <Button
          title="Change password"
          busy={save.isPending}
          onPress={() => save.mutate()}
        />
      )}
    </Screen>
  );
}
