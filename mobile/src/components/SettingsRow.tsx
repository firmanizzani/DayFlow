import type { PropsWithChildren, ReactNode } from 'react';
import { View, Pressable } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Label } from './ui';
import { useTheme } from '@/theme';

export function SettingsGroup({ children }: PropsWithChildren) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 20,
        backgroundColor: theme.surface,
      }}
    >
      {children}
    </View>
  );
}

export function SettingsRow({
  icon: Icon,
  title,
  detail,
  onPress,
  trailing,
  last = false,
}: {
  icon: LucideIcon;
  title: string;
  detail?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  last?: boolean;
}) {
  const theme = useTheme();
  const content = (
    <>
      <Icon size={23} color={theme.ink} strokeWidth={1.7} />
      <View style={{ flex: 1, gap: 3 }}>
        <Label bold size={14}>
          {title}
        </Label>
        {detail && (
          <Label muted size={12}>
            {detail}
          </Label>
        )}
      </View>
      {trailing ?? (onPress ? <ChevronRight size={18} color={theme.muted} /> : null)}
    </>
  );
  const style = {
    minHeight: 76,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    borderBottomWidth: last ? 0 : 1,
    borderBottomColor: theme.border,
  };
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={style}>
      {content}
    </Pressable>
  ) : (
    <View style={style}>{content}</View>
  );
}
