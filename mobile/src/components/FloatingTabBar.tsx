import { Fragment, useEffect, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Timer } from 'lucide-react-native';
import { useTheme } from '@/theme';

export function FloatingTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const theme = useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardVisible) return null;

  // Keep the bar in layout flow, reserving its height so it never covers content.
  // At 320px: 288px pill - 12px padding - 56px Focus slot = 55px per tab.
  return (
    <View
      style={{
        backgroundColor: theme.background,
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 12) + 8,
        paddingLeft: Math.max(insets.left, 16),
        paddingRight: Math.max(insets.right, 16),
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
          minHeight: 72,
          paddingHorizontal: 6,
          paddingVertical: 6,
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 36,
          backgroundColor: theme.surface,
          shadowColor: theme.isDark ? '#000000' : '#29234C',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: theme.isDark ? 0.22 : 0.09,
          shadowRadius: 16,
          elevation: 6,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const selected = index === state.index;
          const color = selected
            ? theme.isDark
              ? theme.primary
              : '#6553DB'
            : theme.muted;
          const title =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);
          return (
            <Fragment key={route.key}>
              {index === 2 && (
                <Pressable
                  cssInterop={false}
                  accessibilityRole="button"
                  accessibilityLabel="Open focus timer"
                  testID="tab-focus-action"
                  onPress={() => router.push('/focus')}
                  style={({ pressed }) => ({
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.isDark ? theme.primary : '#6553DB',
                    opacity: pressed ? 0.82 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  })}
                >
                  <Timer size={25} strokeWidth={1.9} color={theme.primaryInk} />
                </Pressable>
              )}
              <Pressable
                cssInterop={false}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                aria-selected={selected}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? title}
                testID={options.tabBarButtonTestID ?? `tab-${route.name}`}
                onPress={() => {
                  const event = emitter.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!selected && !event.defaultPrevented) navigateToTab(route.key);
                }}
                onLongPress={() =>
                  emitter.emit({ type: 'tabLongPress', target: route.key })
                }
                style={({ pressed }) => ({
                  flex: 1,
                  minWidth: 48,
                  minHeight: 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  borderRadius: 24,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                {options.tabBarIcon?.({ focused: selected, color, size: 22 })}
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: selected ? 'JakartaBold' : 'Jakarta',
                    fontSize: 11,
                    lineHeight: 16,
                    color,
                  }}
                >
                  {title}
                </Text>
              </Pressable>
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}
