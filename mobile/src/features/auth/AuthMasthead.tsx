import { Pressable, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { Brand } from '@/components/Brand';
import { useTheme } from '@/theme';

export function AuthMasthead({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ paddingTop: compact ? 0 : 14, paddingBottom: compact ? 12 : 20 }}>
      <View style={{ minHeight: 56, alignItems: 'center', justifyContent: 'center' }}>
        {compact && (
          <Pressable
            cssInterop={false}
            accessibilityRole="button"
            accessibilityLabel="Back to sign in"
            onPress={() => router.replace('/(auth)/login')}
            style={({ pressed }) => ({
              position: 'absolute',
              left: 0,
              minWidth: 48,
              minHeight: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 24,
              opacity: pressed ? 0.55 : 1,
              backgroundColor: theme.soft,
            })}
          >
            <ArrowLeft size={20} color={theme.isDark ? theme.primary : '#5948C5'} />
          </Pressable>
        )}
        <Brand />
      </View>
      <Svg
        aria-hidden={true}
        pointerEvents="none"
        width="100%"
        height={compact ? 38 : 72}
        viewBox="0 0 360 72"
        preserveAspectRatio="none"
        style={{ marginTop: compact ? 8 : 16 }}
      >
        <Path
          d="M-16 54C58 54 70 10 144 10S234 62 376 24"
          stroke={theme.primary}
          strokeWidth={1.4}
          opacity={theme.isDark ? 0.45 : 0.32}
          fill="none"
        />
        <Path
          d="M-16 68C62 68 86 34 152 34S252 72 376 44"
          stroke={theme.primary}
          strokeWidth={1}
          opacity={theme.isDark ? 0.22 : 0.17}
          fill="none"
        />
      </Svg>
    </View>
  );
}
