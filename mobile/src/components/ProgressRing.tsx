import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, {
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Label } from './ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({
  value,
  size = 116,
  light = false,
}: {
  value: number;
  size?: number;
  light?: boolean;
}) {
  const center = size / 2;
  const radius = center - 14;
  const circumference = Math.PI * 2 * radius;
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(value / 100, {
      duration: 300,
      reduceMotion: ReduceMotion.System,
    });
  }, [value]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        {!light &&
          Array.from({ length: 20 }, (_, index) => {
            const angle = (index * Math.PI) / 10;
            return (
              <Line
                key={index}
                x1={center + Math.cos(angle) * (radius + 9)}
                y1={center + Math.sin(angle) * (radius + 9)}
                x2={center + Math.cos(angle) * (radius + 12)}
                y2={center + Math.sin(angle) * (radius + 12)}
                stroke="#B7ABF2"
                strokeWidth={1}
              />
            );
          })}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={light ? '#D4C7F8' : '#8B7CC3'}
          strokeWidth={light ? 9 : 6}
          fill="transparent"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={light ? '#7366F0' : '#DAF7E9'}
          strokeWidth={light ? 9 : 6}
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      <Label size={size < 100 ? 23 : 28} bold color={light ? '#29234C' : '#FFFFFF'}>
        {value}%
      </Label>
    </View>
  );
}
