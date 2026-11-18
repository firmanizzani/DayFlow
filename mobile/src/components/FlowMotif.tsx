import Svg, { Path } from 'react-native-svg';

export function FlowMotif({
  color = '#B8A6EE',
  opacity = 0.42,
}: {
  color?: string;
  opacity?: number;
}) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 400 180"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0 }}
      pointerEvents="none"
    >
      <Path
        d="M0 128C82 128 116 204 210 156S328 62 400 94V180H0Z"
        fill={color}
        opacity={opacity}
      />
      <Path
        d="M0 168C94 106 166 178 250 134S350 110 400 46V180H0Z"
        fill={color}
        opacity={opacity * 0.65}
      />
    </Svg>
  );
}
