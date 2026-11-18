import { Image, View } from 'react-native';

const artwork = [
  require('../../assets/onboarding/capture.png'),
  require('../../assets/onboarding/plan.png'),
  require('../../assets/onboarding/focus.png'),
];
const descriptions = [
  'Lavender notebook with a checklist and pencil',
  'Lavender calendar with a mint clock and time blocks',
  'Lavender focus timer with a completed task card',
];

export function OnboardingArt({
  page,
  height = 280,
}: {
  page: number;
  height?: number;
}) {
  return (
    <View
      style={{ height, width: '100%', alignItems: 'center', justifyContent: 'center' }}
    >
      <Image
        source={artwork[page]}
        accessibilityLabel={descriptions[page]}
        resizeMode="contain"
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}
