import '../global.css';
import { useEffect } from 'react';
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
import { AppState, ActivityIndicator, View } from 'react-native';
import { queryClient } from '@/services/api';
import { useSession } from '@/store/session';
import { NotificationReconciler } from '@/services/notifications';
import { FocusRuntime } from '@/services/FocusRuntime';

void SplashScreen.preventAutoHideAsync();

function Navigation() {
  const { user, hydrated, onboardingSeen, hydrate } = useSession();
  const segments = useSegments();
  const [fonts, fontError] = useFonts({
    Jakarta: PlusJakartaSans_400Regular,
    JakartaBold: PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  useEffect(() => {
    if (hydrated && (fonts || fontError)) void SplashScreen.hideAsync();
  }, [hydrated, fonts, fontError]);
  useEffect(() => {
    if (!hydrated) return;
    const route = segments[0];
    if (
      !user &&
      !['(auth)', 'onboarding', 'reset-password'].includes(route as string)
    ) {
      router.replace(onboardingSeen ? '/(auth)/login' : '/onboarding');
    } else if (user && (route === '(auth)' || route === 'onboarding')) {
      router.replace('/(tabs)');
    }
  }, [user, hydrated, onboardingSeen, segments]);

  if (!hydrated || (!fonts && !fontError)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#393276', justifyContent: 'center' }}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8F9FD' },
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
    </>
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
