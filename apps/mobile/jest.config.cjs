/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  moduleNameMapper: {
    '^@fitnessapp/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^react-dom$': '<rootDir>/__mocks__/react-dom.js',
    '^@expo-google-fonts/rubik$': '<rootDir>/__mocks__/rubik.js',
    // The shared package uses ESM-style explicit `.js` extensions for Node
    // NodeNext resolution. Strip them when jest-expo's babel transformer
    // resolves modules.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // pnpm stores packages under node_modules/.pnpm/<encoded-name>@<version>.
  // Let Babel process React Native / Expo Flow syntax at that first boundary;
  // the preset's default rule handles the inner node_modules boundary.
  transformIgnorePatterns: [
    'node_modules[\\\\/]\\.pnpm[\\\\/](?!(?:@react-native\\+.*|react-native|expo(?:nent)?(?:-.*)?|@expo\\+.*|@expo-google-fonts\\+.*|jest-expo)@)',
    'node_modules[\\\\/](?!\\.pnpm|((jest-)?react-native|@react-native(-community)?)|expo(nent)?(?:-.*)?|@expo(nent)?[\\\\/].*|@expo-google-fonts[\\\\/].*|react-navigation|@react-navigation[\\\\/].*|@unimodules[\\\\/].*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/App.tsx',
    '!src/services/nativeSecureStorage.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
