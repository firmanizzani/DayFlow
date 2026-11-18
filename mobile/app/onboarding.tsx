import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { router } from 'expo-router';
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
  },
  {
    title: 'Turn your tasks into a plan.',
    body: 'Make space for your priorities with a daily timeline that feels like you.',
  },
  {
    title: 'Make progress, one day at a time.',
    body: 'Find your focus, take a break, and see how far you have come.',
  },
];

export default function Onboarding() {
  const [page, setPage] = useState(0);
  const pager = useRef<ComponentRef<typeof ScrollView>>(null);
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const contentWidth = Math.min(width, 560) - 40;
  const artHeight = Math.min(300, Math.max(220, height * 0.33));
  useEffect(() => {
    pager.current?.scrollTo({ x: page * contentWidth, animated: false });
  }, [contentWidth]);
  async function finish() {
    await useSession.getState().finishOnboarding();
    router.replace('/(auth)/register');
  }
  function next() {
    const selected = Math.min(2, page + 1);
    setPage(selected);
    pager.current?.scrollTo({ x: selected * contentWidth, animated: !reducedMotion });
  }
  return (
    <Screen scroll={false}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(20, insets.bottom),
          maxWidth: 560,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <View
          style={{
            minHeight: 56,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Brand />
          <Pressable
            accessibilityRole="button"
            onPress={finish}
            style={{
              minWidth: 44,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Label muted>Skip</Label>
          </Pressable>
        </View>
        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          onMomentumScrollEnd={(event) =>
            setPage(
              Math.max(
                0,
                Math.min(
                  2,
                  Math.round(event.nativeEvent.contentOffset.x / contentWidth),
                ),
              ),
            )
          }
        >
          {pages.map((item, index) => (
            <ScrollView
              key={item.title}
              style={{ width: contentWidth }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                paddingVertical: 16,
                gap: 24,
              }}
            >
              <LinearGradient
                colors={theme.isDark ? ['#393276', '#6650A7'] : ['#F0EAFF', '#DDD3FA']}
                style={{
                  height: artHeight,
                  borderRadius: 28,
                  padding: 10,
                  overflow: 'hidden',
                }}
              >
                <OnboardingArt page={index} height={artHeight - 20} />
              </LinearGradient>
              <View style={{ gap: 14 }}>
                <Label size={width < 360 ? 28 : 31} bold heading>
                  {item.title}
                </Label>
                <Label muted size={16}>
                  {item.body}
                </Label>
              </View>
            </ScrollView>
          ))}
        </ScrollView>
        <View style={{ paddingTop: 16, gap: 20 }}>
          <View
            accessible
            accessibilityLabel={'Page ' + (page + 1) + ' of 3'}
            accessibilityLiveRegion="polite"
            style={{ flexDirection: 'row', gap: 8, alignSelf: 'center' }}
          >
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
            onPress={page === 2 ? finish : next}
          />
        </View>
      </View>
    </Screen>
  );
}
