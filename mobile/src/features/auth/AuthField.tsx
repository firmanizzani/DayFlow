import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Label } from '@/components/ui';
import { useTheme } from '@/theme';

export const AuthField = forwardRef<
  ComponentRef<typeof TextInput>,
  TextInputProps & {
    label: string;
    icon: ReactNode;
    error?: string;
    password?: boolean;
    feedback?: ReactNode;
    trailing?: ReactNode;
  }
>(function AuthField(
  { label, icon, error, password, feedback, trailing, onBlur, ...props },
  ref,
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Label size={14} bold>
        {label}
      </Label>
      <View
        style={{
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 16,
          paddingRight: password ? 4 : 16,
          borderRadius: 16,
          backgroundColor: theme.surface,
          borderWidth: 1.5,
          borderColor: error ? theme.danger : focused ? theme.primary : theme.border,
          gap: 12,
        }}
      >
        {icon}
        <TextInput
          {...props}
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error}
          secureTextEntry={password && !visible}
          placeholderTextColor={theme.muted}
          selectionColor={theme.primary}
          cursorColor={theme.primary}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 52,
            paddingVertical: 12,
            paddingHorizontal: 0,
            color: theme.ink,
            fontFamily: 'Jakarta',
            fontSize: 15,
            outlineWidth: 0,
          }}
        />
        {trailing}
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            onPress={() => setVisible((current) => !current)}
            style={({ pressed }) => ({
              minWidth: 48,
              minHeight: 48,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.55 : 1,
            })}
          >
            {visible ? (
              <EyeOff size={19} color={theme.muted} />
            ) : (
              <Eye size={19} color={theme.muted} />
            )}
          </Pressable>
        )}
      </View>
      {error ? (
        <View accessibilityRole="alert">
          <Label size={13} color={theme.danger}>
            {error}
          </Label>
        </View>
      ) : (
        feedback
      )}
    </View>
  );
});
