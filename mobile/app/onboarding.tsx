import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ListTodo, CalendarDays, Timer, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Label, Button } from '@/components/ui';
import { useSession } from '@/store/session';
import { useTheme } from '@/theme';
import { OnboardingArt } from '@/components/OnboardingArt';
import { Brand } from '@/components/Brand';

const pages = [
  {
    title: 'Everything you need to do, all in one place.',
    body: 'Capture a thought. Clear your head. Give every task a home.',
    icon: ListTodo,
    sample: 'A little room for what matters',
  },
  {
    title: 'Turn your tasks into a plan.',
    body: 'Make space for your priorities with a daily timeline that feels like you.',
    icon: CalendarDays,
    sample: 'One task. The right moment.',
  },
  {
    title: 'Make progress, one day at a time.',
    body: 'Find your focus, take a break, and see how far you have come.',
    icon: Timer,
    sample: 'Small steps add up',
  },
];

export default function Onboarding() {
  const [page, setPage] = useState(0);
  const theme = useTheme();
  const current = pages[page];
  const Icon = current.icon;
  async function finish() {
    await useSession.getState().finishOnboarding();
    router.replace('/(auth)/register');
  }
  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Brand />
        <Pressable onPress={finish} style={{ padding: 12 }}>
          <Label muted>Skip</Label>
        </Pressable>
      </View>
      <LinearGradient
        colors={['#393276', '#7366F0']}
        style={{
          minHeight: 300,
          borderRadius: 32,
          padding: 22,
          justifyContent: 'center',
          gap: 28,
        }}
      >
        <OnboardingArt page={page} />
      </LinearGradient>
      <View style={{ gap: 16, paddingVertical: 16 }}>
        <Label size={31} bold>
          {current.title}
        </Label>
        <Label muted size={16}>
          {current.body}
        </Label>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={{
              width: index === page ? 28 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === page ? theme.primary : theme.border,
            }}
          />
        ))}
      </View>
      <Button
        title={page === 2 ? 'Get started' : 'Next'}
        onPress={page === 2 ? finish : () => setPage(page + 1)}
      />
    </Screen>
  );
}
