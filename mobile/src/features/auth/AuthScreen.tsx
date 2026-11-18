import { useRef, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Check, LockKeyhole, Mail, UserRound } from 'lucide-react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Label, ErrorNotice } from '@/components/ui';
import { AuthMasthead } from './AuthMasthead';
import { api } from '@/services/api';
import { useSession } from '@/store/session';
import { useTheme } from '@/theme';
import type { Session } from '@/types';
import { authSchema, authFields } from './schema';
import { AuthField } from './AuthField';

type FieldName = keyof z.infer<typeof authFields>;
const labels = {
  name: 'Full name',
  email: 'Email address',
  password: 'Password',
  confirm: 'Confirm password',
};

export function AuthScreen({ register = false }: { register?: boolean }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const inputs = useRef<
    Partial<Record<FieldName, ComponentRef<typeof TextInput> | null>>
  >({});
  const { control, handleSubmit, watch } = useForm({
    resolver: zodResolver(authSchema(register)),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });
  const password = watch('password');
  const confirm = watch('confirm');
  const validPassword = authFields.shape.password.safeParse(password).success;
  const matches = !!confirm && confirm === password;
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof authFields>) => {
      const session = await api<Session>(`/auth/${register ? 'register' : 'login'}`, {
        method: 'POST',
        anonymous: true,
        body: { ...values, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      });
      await useSession.getState().setSession(session);
      router.replace('/(tabs)');
    },
  });
  const submit = handleSubmit((values) => mutation.mutate(values));
  const fields: FieldName[] = register
    ? ['name', 'email', 'password', 'confirm']
    : ['email', 'password'];
  const linkColor = theme.isDark ? theme.primary : '#5948C5';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            flexGrow: 1,
            width: '100%',
            maxWidth: 504,
            alignSelf: 'center',
            paddingHorizontal: width < 360 ? 20 : 24,
            paddingTop: 16,
            paddingBottom: 24,
          }}
        >
          <AuthMasthead compact={register} />
          <View style={{ gap: 8, marginBottom: register ? 20 : 26 }}>
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: 'JakartaBold',
                fontSize: width < 360 ? 25 : 28,
                lineHeight: 36,
                letterSpacing: -0.8,
                color: theme.ink,
              }}
            >
              {register ? 'Create your account' : 'Sign in to Dayflow'}
            </Text>
            <Label muted size={14}>
              {register
                ? 'A fresh start for your tasks, plans, and focus.'
                : 'Welcome back. Pick up where you left off.'}
            </Label>
          </View>
          <View style={{ gap: register ? 14 : 18 }}>
            {fields.map((name, index) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field, fieldState }) => (
                  <AuthField
                    ref={(input) => {
                      inputs.current[name] = input;
                      field.ref(input);
                    }}
                    label={labels[name]}
                    icon={
                      name === 'email' ? (
                        <Mail size={18} color={theme.muted} />
                      ) : name === 'name' ? (
                        <UserRound size={18} color={theme.muted} />
                      ) : (
                        <LockKeyhole size={18} color={theme.muted} />
                      )
                    }
                    placeholder={
                      {
                        name: 'Your full name',
                        email: 'you@example.com', // taste-skill-ignore: input format hint, never fabricated account data.
                        password: register
                          ? 'Create a password'
                          : 'Enter your password',
                        confirm: 'Re-enter your password',
                      }[name]
                    }
                    value={field.value}
                    onChangeText={(value) => {
                      field.onChange(value);
                      if (mutation.error) mutation.reset();
                    }}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    password={name === 'password' || name === 'confirm'}
                    editable={!mutation.isPending}
                    autoCapitalize={name === 'name' ? 'words' : 'none'}
                    autoCorrect={false}
                    keyboardType={name === 'email' ? 'email-address' : 'default'}
                    autoComplete={
                      name === 'name'
                        ? 'name'
                        : name === 'email'
                          ? 'email'
                          : register
                            ? 'new-password'
                            : 'current-password'
                    }
                    returnKeyType={index === fields.length - 1 ? 'go' : 'next'}
                    submitBehavior={
                      index === fields.length - 1 ? 'blurAndSubmit' : 'submit'
                    }
                    onSubmitEditing={() => {
                      const next = fields[index + 1];
                      if (next) inputs.current[next]?.focus();
                      else if (!mutation.isPending) void submit();
                    }}
                    trailing={
                      name === 'confirm' && matches ? (
                        <Check
                          size={18}
                          color={theme.success}
                          accessibilityLabel="Passwords match"
                        />
                      ) : undefined
                    }
                    feedback={
                      register && name === 'password' ? (
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        >
                          {validPassword && <Check size={14} color={theme.success} />}
                          <Label
                            size={12}
                            color={validPassword ? theme.success : theme.muted}
                          >
                            {validPassword
                              ? 'Password meets the requirements'
                              : 'Use at least 8 characters.'}
                          </Label>
                        </View>
                      ) : name === 'confirm' && matches ? (
                        <Label size={12} color={theme.success}>
                          Passwords match
                        </Label>
                      ) : undefined
                    }
                  />
                )}
              />
            ))}
          </View>
          {!register && (
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/(auth)/forgot-password')}
              style={({ pressed }) => ({
                minHeight: 48,
                alignSelf: 'flex-end',
                justifyContent: 'center',
                marginTop: 2,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Label size={13} bold color={linkColor}>
                Forgot password?
              </Label>
            </Pressable>
          )}
          <View style={{ marginTop: register ? 24 : 12, gap: 16 }}>
            <ErrorNotice error={mutation.error} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={register ? 'Create account' : 'Sign in'}
              accessibilityState={{
                disabled: mutation.isPending,
                busy: mutation.isPending,
              }}
              disabled={mutation.isPending}
              onPress={() => void submit()}
              style={({ pressed }) => ({
                minHeight: 56,
                borderRadius: 16,
                padding: 16,
                backgroundColor: theme.isDark ? theme.primary : '#6553DB',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {mutation.isPending ? (
                <ActivityIndicator color={theme.primaryInk} />
              ) : (
                <>
                  <Label bold color={theme.primaryInk}>
                    {register ? 'Create account' : 'Sign in'}
                  </Label>
                  <ArrowRight size={18} color={theme.primaryInk} />
                </>
              )}
            </Pressable>
          </View>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              columnGap: 5,
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            <Label size={13} muted>
              {register ? 'Already have an account?' : 'New to Dayflow?'}
            </Label>
            <Pressable
              accessibilityRole="link"
              onPress={() =>
                router.replace(register ? '/(auth)/login' : '/(auth)/register')
              }
              style={({ pressed }) => ({
                minHeight: 48,
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Label size={13} bold color={linkColor}>
                {register ? 'Sign in' : 'Create an account'}
              </Label>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
