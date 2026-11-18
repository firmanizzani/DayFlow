import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Screen, Header, Field, Button, Label, ErrorNotice } from '@/components/ui';
import { api } from '@/services/api';
import { useSession } from '@/store/session';
import { useTheme } from '@/theme';
import type { Session } from '@/types';
import { authSchema, authFields } from './schema';
import { Brand } from '@/components/Brand';

const base = authFields;

export function AuthScreen({ register = false }: { register?: boolean }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const schema = authSchema(register);
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof base>) => {
      const session = await api<Session>(`/auth/${register ? 'register' : 'login'}`, {
        method: 'POST',
        anonymous: true,
        body: { ...values, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      });
      await useSession.getState().setSession(session);
      router.replace('/(tabs)');
    },
  });
  const fields = register
    ? (['name', 'email', 'password', 'confirm'] as const)
    : (['email', 'password'] as const);
  return (
    <Screen>
      <View style={{ paddingTop: 28, paddingBottom: 24, gap: 36 }}>
        <Brand />
        <Header
          title={register ? 'Make room for a better day.' : 'A fresh start, every day.'}
          subtitle={
            register
              ? 'Create your account and find your flow.'
              : 'Welcome back. Your plans are waiting.'
          }
        />
      </View>
      {fields.map((name) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field, fieldState }) => (
            <Field
              label={
                {
                  name: 'Full name',
                  email: 'Email address',
                  password: 'Password',
                  confirm: 'Confirm password',
                }[name]
              }
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoCapitalize={name === 'name' ? 'words' : 'none'}
              keyboardType={name === 'email' ? 'email-address' : 'default'}
              secureTextEntry={(name === 'password' || name === 'confirm') && !visible}
              autoComplete={
                name === 'email'
                  ? 'email'
                  : name === 'password'
                    ? register
                      ? 'new-password'
                      : 'current-password'
                    : 'off'
              }
            />
          )}
        />
      ))}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={() => setVisible(!visible)}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Label size={13} muted>
            {visible ? 'Hide password' : 'Show password'}
          </Label>
        </Pressable>
        {!register && (
          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Label size={13} color={theme.primary}>
              Forgot password?
            </Label>
          </Pressable>
        )}
      </View>
      <ErrorNotice error={mutation.error} />
      <Button
        title={register ? 'Create account' : 'Sign in'}
        busy={mutation.isPending}
        onPress={handleSubmit((values) => mutation.mutate(values))}
      />
      <Button
        secondary
        title={
          register ? 'Already have an account? Sign in' : 'New here? Create an account'
        }
        onPress={() => router.replace(register ? '/(auth)/login' : '/(auth)/register')}
      />
    </Screen>
  );
}
