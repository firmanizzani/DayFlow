import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Screen, Header, Field, Button, Label, ErrorNotice } from '@/components/ui';
import { mutate } from '@/services/api';
import { useSession } from '@/store/session';
import type { User } from '@/types';

export default function Profile() {
  const session = useSession();
  const [name, setName] = useState(session.user?.name ?? '');
  const [timezone, setTimezone] = useState(session.user?.timezone ?? 'UTC');
  const save = useMutation({
    mutationFn: async () => {
      const user = await mutate<User>('/users/me', 'PATCH', { name, timezone });
      const latest = useSession.getState();
      if (latest.accessToken && latest.refreshToken) {
        await latest.setSession({
          user,
          accessToken: latest.accessToken,
          refreshToken: latest.refreshToken,
        });
      }
    },
  });
  return (
    <Screen>
      <Header back title="Your profile" subtitle={session.user?.email} />
      <Field
        label="Full name"
        value={name}
        onChangeText={setName}
        autoComplete="name"
      />
      <Field
        label="Timezone"
        value={timezone}
        onChangeText={setTimezone}
        autoCapitalize="none"
      />
      <Label size={13} muted>
        Use an IANA timezone, such as Asia/Jakarta or Asia/Bangkok.
      </Label>
      <ErrorNotice error={save.error} />
      {save.isSuccess && <Label>Profile saved.</Label>}
      <Button
        title="Save profile"
        busy={save.isPending}
        onPress={() => save.mutate()}
      />
    </Screen>
  );
}
