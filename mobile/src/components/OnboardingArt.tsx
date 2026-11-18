import { View } from 'react-native';
import { Check, Circle, CalendarDays, Timer } from 'lucide-react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { Label } from './ui';

export function OnboardingArt({ page }: { page: number }) {
  return (
    <Animated.View
      key={page}
      entering={FadeIn.duration(240).reduceMotion(ReduceMotion.System)}
      style={{ minHeight: 270, justifyContent: 'center', gap: 14 }}
    >
      {page === 0 && (
        <>
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: '#E6E0FF',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Circle size={16} color="#6556B7" />
            <Label size={12} bold color="#393276">
              A little less on your mind
            </Label>
          </View>
          {[
            'Capture your next idea',
            'Make something meaningful',
            'Leave room for yourself',
          ].map((title, index) => (
            <View
              key={title}
              style={{
                padding: 17,
                borderRadius: 17,
                backgroundColor:
                  index === 0 ? '#FFFFFF' : index === 1 ? '#E9E3FF' : '#DDF8EE',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                transform: [
                  { rotate: `${index === 0 ? -3 : index === 1 ? 2 : -1}deg` },
                ],
                marginLeft: index === 1 ? 16 : 0,
                marginRight: index === 0 ? 12 : 0,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  backgroundColor: index === 0 ? '#7366F0' : '#FFFFFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {index === 0 && <Check size={16} color="#FFFFFF" />}
              </View>
              <Label size={13} bold color="#393276">
                {title}
              </Label>
            </View>
          ))}
        </>
      )}
      {page === 1 && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CalendarDays size={24} color="#EAE3FF" />
            <Label size={18} bold color="#FFFFFF">
              A day with room to breathe
            </Label>
          </View>
          {[
            {
              time: '09:00',
              title: 'Time for your ideas',
              color: '#E9E3FF',
              height: 100,
            },
            { time: '10:30', title: 'A moment to reset', color: '#DDF8EE', height: 68 },
          ].map((block) => (
            <View key={block.time} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ paddingTop: 14 }}>
                <Label size={12} color="#EAE3FF">
                  {block.time}
                </Label>
              </View>
              <View
                style={{
                  flex: 1,
                  minHeight: block.height,
                  borderRadius: 16,
                  backgroundColor: block.color,
                  padding: 16,
                  gap: 8,
                }}
              >
                <Label size={14} bold color="#393276">
                  {block.title}
                </Label>
                <Label size={12} color="#65578D">
                  Your task. The right moment.
                </Label>
              </View>
            </View>
          ))}
        </>
      )}
      {page === 2 && (
        <View style={{ alignItems: 'center', gap: 20 }}>
          <View
            style={{
              width: 190,
              height: 190,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg
              width={190}
              height={190}
              style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
            >
              <SvgCircle
                cx={95}
                cy={95}
                r={86}
                stroke="#9686D9"
                strokeWidth={5}
                fill="transparent"
              />
              <SvgCircle
                cx={95}
                cy={95}
                r={86}
                stroke="#DAF7E9"
                strokeWidth={5}
                fill="transparent"
                strokeDasharray={540}
                strokeDashoffset={135}
                strokeLinecap="round"
              />
            </Svg>
            <Timer size={24} color="#DAF7E9" />
            <Label size={40} bold color="#FFFFFF">
              25:00
            </Label>
            <Label size={12} color="#EAE3FF">
              One thing at a time
            </Label>
          </View>
          <Label size={16} bold color="#FFFFFF">
            Focus. Rest. Find your flow.
          </Label>
        </View>
      )}
    </Animated.View>
  );
}
