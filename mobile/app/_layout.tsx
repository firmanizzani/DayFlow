import '../global.css';
import { useCallback, useEffect, useState } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { queryClient } from '@/services/api';
import { useSession } from '@/store/session';
import { NotificationReconciler } from '@/services/notifications';
import { FocusRuntime } from '@/services/FocusRuntime';
import { StartupScreen } from '@/components/StartupScreen';
import { useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 180 });

function Navigation() {
  const theme = useTheme();
  const { user, hydrated, hydrate } = useSession();
  const segments = useSegments();
  const [startupDone, setStartupDone] = useState(false);
  const finishStartup = useCallback(() => setStartupDone(true), []);
  const [fonts, fontError] = useFonts({
    Jakarta: PlusJakartaSans_400Regular,
    JakartaBold: PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  useEffect(() => {
    if (!hydrated) return;
    const route = segments[0];
    if (
      !user &&
      !['(auth)', 'onboarding', 'reset-password'].includes(route as string)
    ) {
      router.replace('/(auth)/login');
    } else if (user && (route === '(auth)' || route === 'onboarding')) {
      router.replace('/(tabs)');
    }
  }, [user, hydrated, segments]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <View
        style={{ flex: 1 }}
        accessibilityElementsHidden={!startupDone}
        importantForAccessibility={startupDone ? 'auto' : 'no-hide-descendants'}
        pointerEvents={startupDone ? 'auto' : 'none'}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="tasks/edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="planner/index" options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="focus/index"
            options={{ presentation: 'fullScreenModal' }}
          />
        </Stack>
        {user && <NotificationReconciler />}
        {user && <FocusRuntime />}
      </View>
      {!startupDone && (
        <StartupScreen
          ready={hydrated && !!(fonts || fontError)}
          fontsReady={fonts}
          onFinish={finishStartup}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Navigation />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
