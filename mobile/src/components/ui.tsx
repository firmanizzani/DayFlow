import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/theme';
import { addDays, dateKey, weekDates } from '@/utils/date';
import Svg, { Path } from 'react-native-svg';

export function Label({
  children,
  muted = false,
  size = 15,
  bold = false,
  color,
  heading = false,
  lines,
}: PropsWithChildren<{
  muted?: boolean;
  size?: number;
  bold?: boolean;
  color?: string;
  heading?: boolean;
  lines?: number;
}>) {
  const theme = useTheme();
  return (
    <Text
      accessibilityRole={heading ? 'header' : undefined}
      numberOfLines={lines}
      ellipsizeMode="middle"
      style={{
        color: color ?? (muted ? theme.muted : theme.ink),
        fontSize: size,
        lineHeight: size * 1.45,
        fontFamily: bold ? 'JakartaBold' : 'Jakarta',
        flexShrink: 1,
      }}
    >
      {children}
    </Text>
  );
}

export function Screen({
  children,
  refreshing,
  onRefresh,
  scroll = true,
}: PropsWithChildren<{
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
}>) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <Svg
        width="100%"
        height={220}
        viewBox="0 0 400 220"
        preserveAspectRatio="none"
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, right: 0 }}
      >
        <Path d="M86 0H400V185C290 136 255 50 86 0Z" fill={theme.soft} opacity={0.62} />
        <Path
          d="M250 0H400V116C362 102 301 53 250 0Z"
          fill={theme.primary}
          opacity={0.055}
        />
      </Svg>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 44,
              gap: 20,
              maxWidth: 680,
              width: '100%',
              alignSelf: 'center',
            }}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={!!refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.primary}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Header({
  title,
  subtitle,
  back = false,
  action,
  titleSize = 30,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
  titleSize?: number;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {back && (
        <Pressable
          accessibilityLabel="Go back"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(tabs)')
          }
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <ArrowLeft size={24} color={theme.ink} />
        </Pressable>
      )}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Label size={titleSize} bold heading>
            {title}
          </Label>
          {subtitle && <Label muted>{subtitle}</Label>}
        </View>
        {action}
      </View>
    </View>
  );
}

export function Button({
  title,
  onPress,
  busy,
  secondary = false,
  danger = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const color = secondary ? theme.primary : theme.primaryInk;
  return (
    <Pressable
      // Preserve the native style callback; NativeWind flattens functions on native.
      cssInterop={false}
      accessibilityRole="button"
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 52,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: danger ? theme.danger : secondary ? theme.soft : theme.primary,
        opacity: busy || disabled ? 0.5 : pressed ? 0.8 : 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
      })}
    >
      {busy && <ActivityIndicator color={color} />}
      <Label bold color={danger ? '#FFFFFF' : color}>
        {title}
      </Label>
    </Pressable>
  );
}

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const theme = useTheme();
  return (
    <View className="gap-2">
      <Label bold size={14}>
        {label}
      </Label>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.muted}
        style={{
          minHeight: 54,
          borderRadius: 16,
          padding: 16,
          backgroundColor: theme.surface,
          color: theme.ink,
          fontFamily: 'Jakarta',
          fontSize: 15,
          borderWidth: error ? 1 : 0,
          borderColor: theme.danger,
        }}
        {...props}
      />
      {!!error && (
        <Label color={theme.danger} size={13}>
          {error}
        </Label>
      )}
    </View>
  );
}

export function Section({
  title,
  action,
  onAction,
  children,
}: PropsWithChildren<{
  title: string;
  action?: string;
  onAction?: () => void;
}>) {
  const theme = useTheme();
  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Label size={19} bold>
          {title}
        </Label>
        {action && (
          <Pressable
            onPress={onAction}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Label size={13} bold color={theme.primary}>
              {action}
            </Label>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

export function Surface({ children }: PropsWithChildren) {
  const theme = useTheme();
  return (
    <View
      style={{ backgroundColor: theme.surface, padding: 20, borderRadius: 20, gap: 16 }}
    >
      {children}
    </View>
  );
}

export function Empty({
  title,
  message,
  action,
  onAction,
}: {
  title: string;
  message?: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ paddingVertical: 20, gap: 12, alignItems: 'flex-start' }}>
      <CalendarDays size={28} color={theme.primary} />
      <Label size={19} bold>
        {title}
      </Label>
      {message && <Label muted>{message}</Label>}
      {action && onAction && <Button title={action} onPress={onAction} secondary />}
    </View>
  );
}

export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  const theme = useTheme();
  if (!error) return null;
  return (
    <View accessibilityRole="alert" style={{ gap: 10 }}>
      <Label color={theme.danger}>
        {error instanceof Error ? error.message : 'Please try again.'}
      </Label>
      {retry && <Button title="Try again" onPress={retry} secondary />}
    </View>
  );
}

export function Loading() {
  const theme = useTheme();
  return (
    <View accessibilityLabel="Loading content" style={{ gap: 12 }}>
      {[72, 56, 56].map((height, i) => (
        <View
          key={i}
          style={{ height, borderRadius: 16, backgroundColor: theme.border }}
        />
      ))}
    </View>
  );
}

export function Chips<T extends string>({
  values,
  value,
  onChange,
}: {
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {values.map((item) => (
        <Pressable
          key={item}
          accessibilityRole="button"
          accessibilityState={{ selected: value === item }}
          onPress={() => onChange(item)}
          style={{
            paddingHorizontal: 16,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 14,
            backgroundColor: value === item ? theme.primary : theme.surface,
          }}
        >
          <Label size={13} bold color={value === item ? theme.primaryInk : theme.muted}>
            {item.replaceAll('_', ' ')}
          </Label>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function WeekStrip({
  date,
  onChange,
  navigation = true,
  markedDates = [],
}: {
  date: Date;
  onChange: (date: Date) => void;
  navigation?: boolean;
  markedDates?: string[];
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {navigation && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Pressable
            accessibilityLabel="Previous week"
            onPress={() => onChange(addDays(date, -7))}
            style={{ padding: 10 }}
          >
            <ArrowLeft color={theme.muted} size={18} />
          </Pressable>
          <Label bold>
            {date.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </Label>
          <Pressable
            accessibilityLabel="Next week"
            onPress={() => onChange(addDays(date, 7))}
            style={{ padding: 10 }}
          >
            <ArrowRight color={theme.muted} size={18} />
          </Pressable>
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {weekDates(date).map((day) => {
          const active = dateKey(day) === dateKey(date);
          return (
            <Pressable
              key={dateKey(day)}
              accessibilityLabel={day.toDateString()}
              accessibilityState={{ selected: active }}
              onPress={() => onChange(day)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                gap: 8,
                borderRadius: 18,
                backgroundColor: active ? theme.primary : 'transparent',
              }}
            >
              <Label size={12} color={active ? theme.primaryInk : theme.muted}>
                {day.toLocaleDateString('en', { weekday: 'short' })}
              </Label>
              <Label size={17} bold color={active ? theme.primaryInk : theme.ink}>
                {day.getDate()}
              </Label>
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: markedDates.includes(dateKey(day))
                    ? active
                      ? theme.primaryInk
                      : theme.primary
                    : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
