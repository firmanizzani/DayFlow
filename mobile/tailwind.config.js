module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: { colors: { primary: '#7366F0', ink: '#202138', canvas: '#F8F9FD' } },
  },
  plugins: [],
};
