import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(new URL('../package.json', import.meta.url));
const babel = require('@babel/core');
const palette = {
  primary: '#7366F0',
  primaryInk: '#FFFFFF',
  soft: '#F0EDFF',
  danger: '#B93D53',
  success: '#167D64',
  border: '#EAEAF2',
  isDark: false,
};
const NativePressable = function NativePressable() {};
const InteropPressable = function InteropPressable() {};
const interopComponents = new Map([[NativePressable, InteropPressable]]);

// Exercise the installed NativeWind JSX dispatcher, without a device renderer.
// Only platform dependencies are stubbed; components use their real source and
// the same Expo/NativeWind Babel presets as the app.
const dispatcherExports = {} as { default: (jsx: Function) => Function };
const dispatcherSource = fs.readFileSync(
  new URL(
    '../node_modules/react-native-css-interop/dist/runtime/wrap-jsx.js',
    import.meta.url,
  ),
  'utf8',
);
new Function('require', 'exports', 'process', dispatcherSource)(
  (id: string) => {
    if (id === './api') return { interopComponents };
    if (id === './third-party-libs/react-native-safe-area-context') {
      return { maybeHijackSafeAreaProvider: (type: unknown) => type };
    }
    throw new Error(`Unexpected dispatcher dependency: ${id}`);
  },
  dispatcherExports,
  { env: { NODE_ENV: 'test' } },
);
const jsx = dispatcherExports.default((type: unknown, props: unknown) => ({
  type,
  props,
}));

function loadComponent(relativePath: string) {
  const filename = new URL(relativePath, import.meta.url);
  const { code } = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename: filename.pathname,
    configFile: false,
    babelrc: false,
    envName: 'test',
    presets: [
      [require.resolve('babel-preset-expo'), { jsxImportSource: 'nativewind' }],
      require.resolve('nativewind/babel'),
    ],
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
  });
  const module = { exports: {} as Record<string, Function> };
  const placeholder = () => null;
  new Function('require', 'module', 'exports', code)(
    (id: string) => {
      if (id.endsWith('/jsx-runtime') || id.endsWith('/jsx-dev-runtime')) {
        return { jsx, jsxs: jsx, jsxDEV: jsx, Fragment: 'Fragment' };
      }
      if (id === 'react-native') {
        return { Pressable: NativePressable, View: 'View', Text: 'Text' };
      }
      if (id === '@/theme') return { useTheme: () => palette };
      if (id === '@/utils/date') return { timeLabel: () => '10:00' };
      if (id === 'expo-router') return { router: { push: placeholder } };
      if (id === 'lucide-react-native') {
        return new Proxy({}, { get: () => placeholder });
      }
      if (id === 'react-native-safe-area-context')
        return { SafeAreaView: 'SafeAreaView' };
      if (id === 'react-native-svg')
        return { default: 'Svg', Path: 'Path', Circle: 'Circle' };
      if (id === './FlowMotif') return { FlowMotif: placeholder };
      if (id === './ui') return { Label: placeholder, Empty: placeholder };
      return require(id);
    },
    module,
    module.exports,
  );
  return module.exports;
}

test('NativeWind preserves shared button layout, colors and press feedback', () => {
  const { Button } = loadComponent('../src/components/ui.tsx');
  for (const variant of [{}, { secondary: true }, { danger: true }]) {
    const onPress = () => {};
    const button = Button({ title: 'Find focus', onPress, ...variant });
    assert.equal(
      button.type,
      NativePressable,
      'Style callbacks must reach RN Pressable directly',
    );
    assert.equal(button.props.onPress, onPress);
    const idle = button.props.style({ pressed: false });
    const pressed = button.props.style({ pressed: true });
    assert.equal(idle.minHeight, 52);
    assert.equal(idle.borderRadius, 16);
    assert.equal(idle.paddingHorizontal, 20);
    assert.equal(
      idle.backgroundColor,
      'danger' in variant
        ? palette.danger
        : 'secondary' in variant
          ? palette.soft
          : palette.primary,
    );
    assert.equal(pressed.backgroundColor, idle.backgroundColor);
    assert.equal(pressed.opacity, 0.8);
  }
});

test('Timeline cards retain full-width native layout for short task titles', () => {
  const { Timeline } = loadComponent('../src/components/Timeline.tsx');
  const timeline = Timeline({
    plans: [
      {
        id: '1',
        taskId: '1',
        status: 'PLANNED',
        startAt: '2026-11-18T10:00:00Z',
        endAt: '2026-11-18T11:00:00Z',
      },
    ],
    tasks: [{ id: '1', title: 'a', categoryId: null }],
  });
  const card = timeline.props.children[0].props.children.find(
    (child: { type: unknown }) => child.type === NativePressable,
  );
  assert.ok(card, 'Timeline must render an unwrapped native Pressable');
  const style = card.props.style({ pressed: false });
  assert.equal(style.flex, 1);
  assert.equal(style.padding, 16);
  assert.equal(style.borderRadius, 16);
  assert.equal(style.backgroundColor, palette.soft);
  assert.equal(style.minHeight, 84);
});

test('An empty field error never renders a bare text node inside a native View', () => {
  const { Field } = loadComponent('../src/components/ui.tsx');
  const field = Field({ label: 'Start time', error: '' });
  assert.ok(
    field.props.children.every((child: unknown) => typeof child !== 'string'),
    'Empty validation text must not become a raw child of View',
  );
});
