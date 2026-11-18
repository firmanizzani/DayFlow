import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { useTheme } from '@/theme';

export function StartupScreen({
  ready,
  fontsReady,
  onFinish,
}: {
  ready: boolean;
  fontsReady: boolean;
  onFinish: () => void;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const reveal = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const wordmark = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const horizon = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const didHideNative = useRef(false);
  const [entranceDone, setEntranceDone] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      reveal.setValue(1);
      wordmark.setValue(1);
      horizon.setValue(1);
      setEntranceDone(true);
      return;
    }
    const entrance = Animated.sequence([
      Animated.parallel([
        Animated.timing(reveal, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(wordmark, {
          toValue: 1,
          duration: 650,
          delay: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(horizon, {
          toValue: 1,
          duration: 850,
          delay: 750,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
      Animated.delay(200),
    ]);
    entrance.start(({ finished }) => {
      if (finished) setEntranceDone(true);
    });
    return () => entrance.stop();
  }, [reducedMotion, reveal, wordmark, horizon]);

  useEffect(() => {
    if (!ready || !entranceDone) return;
    if (reducedMotion) {
      onFinish();
      return;
    }
    const exit = Animated.timing(opacity, {
      toValue: 0,
      duration: 280,
      useNativeDriver: Platform.OS !== 'web',
    });
    exit.start(({ finished }) => {
      if (finished) onFinish();
    });
    return () => exit.stop();
  }, [ready, entranceDone, reducedMotion, onFinish, opacity]);

  return (
    <Animated.View
      accessibilityViewIsModal
      accessibilityLabel="Opening Dayflow"
      onLayout={() => {
        if (didHideNative.current) return;
        didHideNative.current = true;
        void SplashScreen.hideAsync().catch(() => {});
      }}
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: theme.background,
          alignItems: 'center',
          justifyContent: 'center',
          opacity,
        },
      ]}
    >
      <Animated.Image
        accessible={false}
        source={
          theme.isDark
            ? require('../../assets/splash-dark.png')
            : require('../../assets/splash.png')
        }
        resizeMode="contain"
        style={{
          width: 160,
          height: 160,
          opacity: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }),
          transform: [
            {
              translateY: reveal.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
            {
              scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
            },
          ],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: '50%',
          marginTop: 90,
          alignItems: 'center',
        }}
      >
        <Animated.Text
          style={{
            color: theme.primary,
            fontSize: 36,
            lineHeight: 50,
            letterSpacing: -1,
            fontFamily: fontsReady ? 'JakartaBold' : undefined,
            opacity: fontsReady ? wordmark : 0,
            transform: [
              {
                translateY: wordmark.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          }}
        >
          dayflow
        </Animated.Text>
        <Animated.View
          style={{
            marginTop: 18,
            width: 56,
            height: 3,
            borderRadius: 2,
            backgroundColor: theme.primary,
            opacity: horizon,
            transform: [{ scaleX: horizon }],
          }}
        />
      </View>
    </Animated.View>
  );
}
