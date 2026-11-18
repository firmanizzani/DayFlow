import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Label } from './ui';
import { useTheme } from '@/theme';

export function Brand() {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel="Dayflow"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
    >
      <Svg width={32} height={32} viewBox="0 0 32 32">
        <Circle cx={16} cy={16} r={15} fill={theme.primary} />
        <Path
          d="M8 18a8 8 0 0 1 16 0M8 22h16M16 6v3M6 11l2 2M26 11l-2 2"
          stroke={theme.primaryInk}
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <Label size={27} bold color={theme.primary}>
        dayflow
      </Label>
    </View>
  );
}
